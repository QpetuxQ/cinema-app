import json
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    "ticket.purchased",
    bootstrap_servers=["localhost:9092"],
    auto_offset_reset="earliest",
    enable_auto_commit=False,
    group_id="cinema-qa-consumer",
    value_deserializer=lambda value: json.loads(value.decode("utf-8"))
)

print("Waiting for Kafka messages...")

try:
    for message in consumer:
        print(f"Topic: {message.topic}")
        print(f"Partition: {message.partition}")
        print(f"Offset: {message.offset}")
        print(f"Key: {message.key.decode('utf-8') if message.key else None}")
        print(f"Value: {json.dumps(message.value, ensure_ascii=False, indent=4)}")
        print("-" * 50)

        consumer.commit()

except KeyboardInterrupt:
    print("Consumer stopped")

finally:
    consumer.close()