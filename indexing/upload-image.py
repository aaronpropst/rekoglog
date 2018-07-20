import boto3

s3 = boto3.resource('s3')

# Get list of objects for indexing
images=[
  # ('xiaobing01.jpg','Xiaobing Liu'),
  # ('xiaobing02.jpg','Xiaobing Liu'),
  # ('xiaobing03.jpg','Xiaobing Liu'),
  # ('aaron01.png','Aaron Propst'),
  # ('aaron02.png','Aaron Propst'),
    #   ('aaron03.png','Aaron Propst')
  ('obama1.jpg','obama'),
  ('obama2.jpg','obama')
      ]

# Iterate through list to upload objects to S3   
for image in images:
    file = open(image[0],'rb')
    object = s3.Object('hogshead-face-collection','index/'+ image[0])
    ret = object.put(Body=file,
                    Metadata={'FullName':image[1]}
                    )