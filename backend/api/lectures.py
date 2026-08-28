"""
backend/api/lectures.py


Lecture management endpoints:
- POST /lectures — upload audio/video, start transcription
- GET /lectures — list all lectures
- GET /lectures/{id} — get one lecture with transcript status
- GET /lectures/{id}/transcripts — get the transcript segments (once ready)

Background task handling: transcription runs async so the upload endpoint
returns immediately (status=PROCESSING) and flips to READY once done.
"""

from fastapi import APIRouter, BackgroundTasks, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Lecture, LectureStatus, TranscriptChunk
from backend.schemas import Lecture as LectureSchema, TranscriptSegment
from backend.storage_R2 import save
from backend.ai.transcription import transcribe

router = APIRouter()


async def _transcribe_background(
    lecture_id: int,
    stored_ref: str,
    db: Session,
):
    """Background task: transcribes the lecture and stores segments.
    
    Runs asynchronously so the upload endpoint can return immediately.
    """
    try:
        # Transcribe
        segments = transcribe(stored_ref, lecture_id=lecture_id)

        # Store each segment
        for seg in segments:
            db.add(TranscriptChunk(
                lecture_id=lecture_id,
                start=seg.start,
                end=seg.end,
                text=seg.text,
                speaker=seg.speaker,
            ))

        # Mark lecture ready
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if lecture:
            lecture.status = LectureStatus.READY
            db.commit()
    except Exception as e:
        # Mark failed and log error
        lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if lecture:
            lecture.status = LectureStatus.FAILED
            db.commit()
        print(f"Transcription failed for lecture {lecture_id}: {e}")


@router.post("/lectures", response_model=LectureSchema)
async def upload_lecture(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """Upload an audio or video file to be transcribed.

    Returns immediately with status=PROCESSING. The actual transcription
    runs in the background and marks the lecture READY once done.
    
    Args:
        file: Audio (mp3, wav, m4a, etc.) or video (mp4, mov, etc.)
    
    Returns:
        Lecture object with id, filename, status (PROCESSING), audio_url
    """
    try:
        # Save uploaded file to storage (R2 / local disk)
        # UploadFile.file is a SpooledTemporaryFile we can read
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            contents = await file.read()
            tmp.write(contents)
            tmp_path = tmp.name

        stored_ref = save(tmp_path, file.filename)
        audio_url = stored_ref  # For R2, this is the object key; storage.get_url() returns the URL

        # Create lecture row with PROCESSING status
        lecture = Lecture(
            filename=file.filename,
            audio_url=audio_url,
            status=LectureStatus.PROCESSING,
        )
        db.add(lecture)
        db.commit()
        db.refresh(lecture)

        # Queue the transcription to run in the background
        background_tasks.add_task(
            _transcribe_background,
            lecture_id=lecture.id,
            stored_ref=stored_ref,
            db=db,
        )

        return LectureSchema(
            id=lecture.id,
            filename=lecture.filename,
            audio_url=lecture.audio_url,
            status=lecture.status,
            uploaded_at=lecture.uploaded_at,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/lectures", response_model=list[LectureSchema])
def list_lectures(db: Session = Depends(get_db)):
    """List all lectures with their status."""
    lectures = db.query(Lecture).all()
    return [
        LectureSchema(
            id=l.id,
            filename=l.filename,
            audio_url=l.audio_url,
            status=l.status,
            uploaded_at=l.uploaded_at,
        )
        for l in lectures
    ]


@router.get("/lectures/{lecture_id}", response_model=LectureSchema)
def get_lecture(lecture_id: int, db: Session = Depends(get_db)):
    """Get a single lecture by ID."""
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    return LectureSchema(
        id=lecture.id,
        filename=lecture.filename,
        audio_url=lecture.audio_url,
        status=lecture.status,
        uploaded_at=lecture.uploaded_at,
    )


@router.get("/lectures/{lecture_id}/transcripts", response_model=list[TranscriptSegment])
def get_transcripts(lecture_id: int, db: Session = Depends(get_db)):
    """Get transcript segments for a lecture (once transcription is done).
    
    Returns 200 even if transcription is still PROCESSING (empty list).
    Returns 404 if the lecture doesn't exist.
    """
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture:
        raise HTTPException(status_code=404, detail="Lecture not found")
    
    segments = db.query(TranscriptChunk).filter(
        TranscriptChunk.lecture_id == lecture_id
    ).order_by(TranscriptChunk.start).all()
    
    return [
        TranscriptSegment(
            id=seg.id,
            lecture_id=seg.lecture_id,
            start=seg.start,
            end=seg.end,
            text=seg.text,
            speaker=seg.speaker,
        )
        for seg in segments
    ]