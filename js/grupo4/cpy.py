from paho.mqtt import client as mqtt_client
import random
import json
import time

#Mensaje de CPU par actualizar
import psutil

#Mensaje sistema
import platform
import getpass

#Hive
BROKER = 'broker.hivemq.com'
PORT = 1883
TOPIC = "grupo4"

# generate client ID with pub prefix randomly
CLIENT_ID = "python-mqtt-tcp-pub-sub-{id}".format(id=random.randint(0, 1000))
FLAG_CONNECTED = 0


def on_connect(client, userdata, flags, rc):
    global FLAG_CONNECTED
    if rc == 0:
        FLAG_CONNECTED = 1
        print("Connected to MQTT Broker!")
        client.subscribe(TOPIC)
    else:
        print("Failed to connect, return code {rc}".format(rc=rc), )


def on_message(client, userdata, msg):
    print("Received `{payload}` from `{topic}` topic".format(payload=msg.payload.decode(), topic=msg.topic))
    try:
        print("Publishing a message to {} topic".format(TOPIC_ALERT))
        publish(client, TOPIC_ALERT, "This is a message in response to the received message")
    except Exception as e:
        print(e)
        
def connect_mqtt():
    client = mqtt_client.Client(CLIENT_ID)
    #client.username_pw_set(USERNAME, PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(BROKER, PORT)
    return client

# Define la función publish aquí
def publish(client, topic, message):
    message_json = json.dumps(message)
    result = client.publish(topic, message_json, qos=1)

    if result[0] == 0:
        print(f"Se envió mensaje: {message} al tema: {topic}")
    else:
        print(f"No se pudo enviar mensaje al tema: {topic}")


#Envio al archivo en JavaScritp 

client = connect_mqtt()
def run():
    while True:
        client.loop_start()
        time.sleep(1)
        if FLAG_CONNECTED:
            # Rendimiento del suo del CPU
            porcentaje = psutil.cpu_percent(interval=1)
            
            # Rendieminto de la memoria RAM
            memoriav = psutil.virtual_memory()
            memoria = memoriav.percent

            #Porcentaje de uso del disco duro
            discov =  psutil.disk_usage('/')
            disco = discov.percent
            #Porcentaje de uso de la cache
            cache = round(100 - memoriav.available / memoriav.total * 100, 2)

            #Esoecificaciones del compuador
            system_info = platform.uname()
            memory = psutil.virtual_memory()
            sistem = system_info.system
            procesador = system_info.processor
            ramt = round(memory.total/ (1024 ** 3),2)
            disck = round(discov.total/ (1024 ** 3),2)
            nucleos = psutil.cpu_count(logical=False)
            arqma = system_info.machine
            usua = getpass.getuser()
            

            #Forma de envio de datos usando Json
            dato = {
                'CPU': porcentaje,
                'Alc': memoria,
                'Tpt': disco,
                'Cache': cache,
                'Sist' : sistem,
                'Pross' : procesador,
                'RamT' : ramt,
                'DiscoT' : disck,
                'Nucle' : nucleos,
                'ArqM' : arqma,
                'Usr' : usua,
            }
            grftodo = json.dumps(dato)
            # Usa la función publish aquí
            try:
                publish(client, "grupo4", grftodo)
            except Exception as e:
                print(f"Error al publicar mensaje: {e}")
            else:
                print("Mensaje publicado exitosamente")
        else:
            client.loop_stop()


if __name__ == '__main__':
    run()