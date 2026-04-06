# 1. Use an official Python image
FROM python:3.9

# 2. Hugging Face Spaces Requirement: Create a non-root user
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# 3. Create a working directory inside the container
WORKDIR $HOME/app

# 4. Copy your requirements file and install the libraries
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy your actual worker code into the container
COPY --chown=user worker.py .

# 6. Command to run your worker
CMD ["python", "worker.py"]