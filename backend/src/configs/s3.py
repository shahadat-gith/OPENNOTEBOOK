import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name="ap-south-1",
)


def upload_to_s3(file, key, content_type=None):
    extra_args = {}

    if content_type:
        extra_args["ContentType"] = content_type

    s3.upload_fileobj(
        file,
        BUCKET_NAME,
        key,
        ExtraArgs=extra_args,
    )

    return key