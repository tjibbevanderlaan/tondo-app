# Tondo

### An app to stream whiteboard content captured by a webcam.

![Tondo example in browser](https://github.com/tjibbevanderlaan/tondo-app/blob/development/docs/example_tondo.gif?raw=true)

## Installing dependencies
1. Clone this repo
```bash
git clone https://github.com/tjibbevanderlaan/tondo-app.git
cd tondo-app
```
2. Create virtual environment
```bash
virtualenv -p /usr/bin/python3 venv
source venv/activate/bin
```
3. Install dependencies in virtual environment
```bash
pip3 install requirements.txt
```

## Run app
In development mode use:
```bash
python3 app.py
```
Open up a browser and go to http://localhost:5000.

In production, please run:
```bash
gunicorn --worker-class gevent --threads 5 --workers 1 --bind 0.0.0.0:80 app:app
```

## Run as service
A service file `tondo.service` is written to run Tondo as a service on a Raspberry Pi. Please use these instructions to install the service file. 
```bash
cp tondo.service /etc/system/systemd
cd /etc/systemd/systemd
systemctl enable tondo.service
systemctl start tondo.service
```

## License

All files are licensed under the BSD license. See the LICENSE file for details.
Copyright 2020		Tjibbe van der Laan

