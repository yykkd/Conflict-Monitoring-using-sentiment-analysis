# Use the official Python image from the Docker Hub
FROM python:3.9-slim
ENV PYTHONUNBUFFERED True

# Copy the requirements file into the container at /app
COPY requirements.txt .
RUN pip install --upgrade pip
# Install any dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set the working directory in the container
ENV APP_HOME /app
WORKDIR $APP_HOME

# Copy the rest of the application code into the container
COPY . ./


# Expose port 8080 for the Flask app (default for Google Cloud Run)
EXPOSE 8080

# Run the Flask app using Gunicorn
# CMD ["gunicorn", "--bind", "8080", "--workers", "1", "--threads", "8", "app:app"]

# Use gunicorn as the entrypoint
CMD exec gunicorn --bind:$PORT --workers 1 --threads 8 app:app