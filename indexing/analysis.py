import boto3
import io
from PIL import Image

rekognition = boto3.client('rekognition', region_name='us-west-2')
dynamodb = boto3.client('dynamodb', region_name='us-west-2')
    
image = Image.open("xiaobing-test2.jpg")
#image = Image.open("aaron-test.jpeg")
#image = Image.open("aaron01.png")
stream = io.BytesIO()
image.save(stream,format="JPEG")
#image.save(stream,format="PNG")
image_binary = stream.getvalue()


response = rekognition.search_faces_by_image(
        CollectionId='face_collection',
        Image={'Bytes':image_binary}                                       
        )

matchedCount = 0    
faceId = ""

for match in response['FaceMatches']:
    print (match['Face']['FaceId'], match['Face']['Confidence'])

    if match['Face']['Confidence'] > 80:
        matchedCount += 1 
        faceId = match['Face']['FaceId']

if matchedCount >= 2:        

    face = dynamodb.get_item(
        TableName='face_collection',  
        Key={'RekognitionId': {'S': faceId}}
        )
    
    if 'Item' in face:
        print ('Match found, you are:')
        print (face['Item']['FullName']['S'])
    else:
        print ('should not be here')

else:
    print ('match not found')
