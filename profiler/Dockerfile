FROM python:3.11-slim
LABEL authors="blaisedufrain"

RUN pip install --no-cache-dir py-spy

WORKDIR /profiles

ENTRYPOINT ["sh", "-c", "while true; do py-spy record -o /profiles/live_flamegraph.svg --pid 1 --duration 30 --rate 100; done"]
