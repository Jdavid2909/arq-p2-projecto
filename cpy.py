from paho.mqtt import client as mqtt_client
from email.message import EmailMessage
# from firebase_admin import db
# import firebase_admin
# from firebase_admin import credentials
# from firebase_admin import db
from datetime import datetime
# import AVMWeather as weather
import time
import random
import json
import ssl
import smtplib
import psutil
import shutil
import speedtest
import platform
import requests
import base64
import io
import zipfile

class SistemaMonitoreo:
    def __init__(self):
        self.latitud = 0
        self.longitud = 0
        self.pdf = ""
        self.correo = ""
        self.fecha = datetime.today().strftime('%Y-%m-%d')
        self.hora = datetime.today().strftime('%H:%M:%S')
        # self.cred = credentials.Certificate('arquitectura-grupo-10-firebase-adminsdk-z04j2-a56b28d8e2.json')
        # firebase_admin.initialize_app(self.cred, {'databaseURL': 'https://arquitectura-grupo-10-default-rtdb.firebaseio.com'})
        self.client = self.connect_mqtt()
        self.FLAG_CONNECTED = 0

    def connect_mqtt(self):
        BROKER = 'broker.hivemq.com'
        PORT = 1883
        self.TOPIC_DATA = "grupo4.1"
        self.TOPIC_ALERT = "grupo4"
        self.TOPIC_A = "grupo4.2"
        CLIENT_ID = "python-mqtt-tcp-pub-sub-{id}".format(id=random.randint(0, 1000))
        client = mqtt_client.Client(CLIENT_ID)
        client.on_connect = self.on_connect
        client.on_message = self.on_message
        client.connect(BROKER, PORT)

        return client

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.FLAG_CONNECTED = 1
            print("Connected to MQTT Broker!")
            client.subscribe(self.TOPIC_DATA)
            client.subscribe(self.TOPIC_ALERT)
            client.subscribe(self.TOPIC_A)
        else:
            print("Failed to connect, return code {rc}".format(rc=rc), )

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode()
            try:
                objeto_json = json.loads(payload)
                self.latitud = objeto_json['latitud']
                self.longitud = objeto_json['longitud']
                self.publish(client, self.TOPIC_ALERT, msg)
            except ValueError:
                if len(payload) < 50:
                    # Es un correo
                    self.correo = payload
                    print(self.correo)
                    self.publish(client, self.TOPIC_DATA, msg)
                else:
                    # Es una cadena Base64 (PDF)
                    self.pdf = payload
                    print("base")
                    self.publish(client, self.TOPIC_A, msg)
        except Exception as e:
            print(e)

    def publish(self, client, TOPIC, msg): 
        msg = json.dumps(msg)
        result, mid = client.publish(TOPIC, msg)
        if result:
            print(f"Message published on topic {TOPIC} with message ID {mid}")
        else:
            print(f"Failed to publish message on topic {TOPIC}")

    def obtener_velocidad_ethernet(self):
        try:
            st = speedtest.Speedtest()
            st.get_best_server()  
            download_speed = st.download() 
            upload_speed = st.upload()    
            download_speed_mbps = download_speed / 1_000_000  
            upload_speed_mbps = upload_speed / 1_000_000   
            return download_speed_mbps, upload_speed_mbps
        except Exception as e:
            print("Error al obtener la velocidad de Ethernet:", e)
            return None, None

    def obtener_temperatura(self, la, lo):
        lat = la 
        lon = lo  
        api_key = '6966dfafaa55c5b2f7ebde5ed7feeb5d'
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}"
        response = requests.get(url)
        data = response.json()

        
        temperatura_kelvin = data['main']['temp']
        temperatura_celsius = temperatura_kelvin - 273.15

        humedad = data['main']['humidity']
        presion = data['main']['pressure']
        descripcion_tiempo = data['weather'][0]['description']
        velocidad_viento = data['wind']['speed']
        direccion_viento = data['wind']['deg']
        icono_tiempo = data['weather'][0]['icon']

        tem = round(temperatura_celsius, 2)  # Redondear a dos decimales

        print("######################################################")
        print(tem)
        print(humedad)
        print(presion)
        print(descripcion_tiempo)
        print(velocidad_viento)
        print(direccion_viento)
        print(icono_tiempo)
        print("######################################################")

        return tem, humedad, presion, descripcion_tiempo, velocidad_viento, direccion_viento, icono_tiempo

    def informacion_sistema(self):
        ar = platform.architecture()
        ma = platform.machine()
        ve = platform.version()
        pr = platform.processor()
        sy = platform.system()
        return ar, ma, ve, pr, sy

    def porcentaje_uso_Memory(self):
        total_memory = psutil.virtual_memory().total
        virtual_memory = psutil.virtual_memory()
        used_ram = virtual_memory.used
        used_ram_gb = used_ram / (1024 ** 3)
        porcentaje_uso_ram = (used_ram_gb / (total_memory / (1024 ** 3))) * 100
        return porcentaje_uso_ram

    def porcentaje_uso_Disco(self):
        total_disk, used_disk, free_disk = shutil.disk_usage('/')
        used_disk_gb = used_disk / (1024 ** 3)
        free_disk_gb = free_disk / (1024 ** 3)
        total_disk_gb = total_disk / (1024 ** 3)
        porcentaje_uso_disk = (used_disk_gb / total_disk_gb) * 100
        return porcentaje_uso_disk, total_disk_gb, free_disk_gb

    def porcentaje_uso_CPU(self):
        return psutil.cpu_percent(interval=1)

    def enviar_email(self, cont):
        email_emisor = 'jonatan12yanacallo@gmail.com'
        email_password = 'eatzjaetfuwqevhu'
        email_receptor = 'leninalomoto2003@gmail.com'
        asunto = 'RENDIMIENTO CPU'
        cuerpo = 'El porcentaje de uso de su CPU rebaso el 40%, dicho porcentaje es: ' + str(cont) 
        em = EmailMessage()
        em['From'] = email_emisor
        em['To'] = email_receptor
        em['Subject'] = asunto
        em.set_content(cuerpo)
        contexto = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=contexto) as smtp:
            smtp.login(email_emisor, email_password)
            smtp.sendmail(email_emisor, email_receptor, em.as_string())

    # def sendDataFireBase(self, porcentaje_CPU, porcentaje_Memory, porcentaje_Disco, descarga, subida):
    #     try:
    #         ref = db.reference('')
    #         posts_ref = ref.child('presiones')
    #         new_post_ref = posts_ref.push()
    #         new_post_ref.set({
    #             'fecha': self.fecha,
    #             'hora': self.hora,
    #             'CPU':porcentaje_CPU, 
    #             'Memory':porcentaje_Memory,
    #             'Disco':porcentaje_Disco,
    #             'Descarga':descarga,
    #             'Subida':subida
    #         })
    #         print("Registro guardado")
    #     except  Exception as e:
    #         print(e)

    def enviar_email_PDF(self):
        email_emisor = 'jonatan12yanacallo@gmail.com'
        email_password = 'eatzjaetfuwqevhu'
        email_receptor = self.correo
        asunto = 'RESPALDO'
        cuerpo = ''
        em = EmailMessage()
        em['From'] = email_emisor
        em['To'] = email_receptor
        em['Subject'] = asunto
        em.set_content(cuerpo)

        # Adjuntar los archivos al correo electrónico
        for file_data, file_name in self.extracted_files:
            em.add_attachment(file_data, maintype="application", subtype="pdf", filename=file_name)

        contexto = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=contexto) as smtp:
            smtp.login(email_emisor, email_password)
            smtp.sendmail(email_emisor, email_receptor, em.as_string())


    def extraer_archivos_desde_zip(self):
        if self.pdf != "":
            zip_data = base64.b64decode(self.pdf)
            zip_buffer = io.BytesIO(zip_data)
            #output_folder = r"C:\Users\andy\Desktop" 
            self.extracted_files = []
            with zipfile.ZipFile(zip_buffer, "r") as zip_ref:
                for file_info in zip_ref.infolist():
                    with zip_ref.open(file_info) as file:
                        file_data = file.read()
                        self.extracted_files.append((file_data, file_info.filename))

            print("Archivos extraídos del ZIP:")
            for file_name in self.extracted_files:
                print(file_name)

            self.pdf = "" 
            if self.correo != "":
                self.enviar_email_PDF()

    def run(self):
        contador = 1
        tem = 0.0
        h1 = 0
        p1 = 0
        dt1 = ""
        vv1 = 0
        dv1 = 0
        it1 = "01d"
        while True:
            if self.pdf != "":
                self.extraer_archivos_desde_zip()
                self.extracted_files = []
            porcentaje_CPU = self.porcentaje_uso_CPU()
            porcentaje_Memory = self.porcentaje_uso_Memory()
            porcentaje_Disco = self.porcentaje_uso_Disco()
            if contador == 1:
                # porcentaje_Disco = self.porcentaje_uso_Disco()
                # descarga, subida = self.obtener_velocidad_ethernet()
                a = self.informacion_sistema()
                contador = 0

            if self.correo != "" and porcentaje_CPU >= 40:
                self.enviar_email(porcentaje_CPU)

            if self.latitud != 0 and self.longitud != 0:
                temperatura, h, p, dt, vv, dv, it = self.obtener_temperatura(self.latitud, self.longitud)
                #self.sendDataFireBase(porcentaje_CPU, porcentaje_Memory, porcentaje_Disco, descarga, subida)
                data = {
                    'fecha': self.fecha,
                    'hora': self.hora,
                    'CPU': porcentaje_CPU, 
                    'Memory': porcentaje_Memory,
                    'Disco': porcentaje_Disco,
                    # 'Descarga': descarga,
                    # 'Subida': subida,
                    'Temperatura': temperatura,
                    #'a' : a,
                    # 'b' : b,
                    # 'c' : c,
                    # 'd' : d,
                    # 'e' : e,
                    'humedad': h,
                    'presion': p,
                    'descripcion_tiempo': dt,
                    'velocidad_viento': vv,
                    'direccion_viento': dv,
                    'icono_tiempo': it,
                }
                tem = temperatura
                self.latitud = 0
                self.longitud = 0
                h1 = h
                p1 = p
                dt1 = dt
                vv1 = vv
                dv1 = dv
                it1 = it
            else:
                #self.sendDataFireBase(porcentaje_CPU, porcentaje_Memory, porcentaje_Disco, descarga, subida)
                data = {
                    'fecha': self.fecha,
                    'hora': self.hora,
                    'CPU': porcentaje_CPU, 
                    'Memory': porcentaje_Memory,
                    'Disco': porcentaje_Disco,
                    # 'Descarga': descarga,
                    # 'Subida': subida,
                    'Temperatura': tem,
                     #'a' : a,
                    # 'b' : b,
                    # 'c' : c,
                    # 'd' : d,
                    # 'e' : e,
                    'humedad': h1,
                    'presion': p1,
                    'descripcion_tiempo': dt1,
                    'velocidad_viento': vv1,
                    'direccion_viento': dv1,
                    'icono_tiempo': it1,
                }

            string = json.dumps(data)
            self.publish(self.client, self.TOPIC_ALERT, json.loads(string))
            self.client.loop_start()
            time.sleep(1)
            if self.FLAG_CONNECTED:
                print("Wait for message...")
            else:
                self.client.loop_stop()

if __name__ == '__main__':
    sistema_monitoreo = SistemaMonitoreo()
    sistema_monitoreo.run()
