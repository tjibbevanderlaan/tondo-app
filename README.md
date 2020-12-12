# Tondo

### An app to stream whiteboard content captured by a webcam.

## Installing dependencies
```bash
$ git clone https://github.com/tjibbevanderlaan/tondo-app.git
$ cd tondo-app
$ virtualenv -p /usr/bin/python3 venv
$ source venv/activate/bin
$ pip3 install requirements.txt
```

## Run app
```bash
python3 app.py
```

## Run as service
This service file is written to run Tondo as a service on a RaspberryPi.
```bash
cp tondo.service /etc/system/systemd
cd /etc/systemd/systemd
systemctl enable tondo.service
systemctl start tondo.service
```

## License

All files are licensed under the BSD license. See the LICENSE file for details.
Copyright 2020		Tjibbe van der Laan

