FROM --platform=linux/arm64 python:3.10.13

WORKDIR /backend

# Install pip requirements
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt

# Copy everything else over
COPY . .

# Run db migrations and start the server
CMD ["python3", "-m", "app"]
