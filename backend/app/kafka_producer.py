
import json
import logging
from datetime import datetime, timezone

from kafka import KafkaProducer

logger = logging.getLogger(__name__)

_producer = None


def get_producer():
    global _producer

    if _producer is None:
        _producer = KafkaProducer(
            bootstrap_servers=["localhost:9092"],
            value_serializer=lambda value: json.dumps(
                value, ensure_ascii=False
            ).encode("utf-8"),
            retries=3,
            request_timeout_ms=5000,
            max_block_ms=5000,
        )

    return _producer


def publish_ticket_purchased(ticket):
    event = {
        "event_type": "ticket.purchased",
        "event_time": datetime.now(timezone.utc).isoformat(),
        "ticket_id": ticket.id,
        "user_id": ticket.user_id,
        "session_id": ticket.session_id,
        "row_number": ticket.row_number,
        "seat_number": ticket.seat_number,
        "status": ticket.status,
    }

    try:
        producer = get_producer()

        producer.send(
            "ticket.purchased",
            value=event,
            key=str(ticket.id).encode("utf-8"),
        ).get(timeout=10)

        logger.info(
            "Kafka event published: ticket_id=%s",
            ticket.id,
        )

    except Exception:
        # Покупка уже сохранена в БД.
        # Не возвращаем клиенту ошибку покупки из-за Kafka.
        logger.exception(
            "Failed to publish Kafka event: ticket_id=%s",
            ticket.id,
        )
