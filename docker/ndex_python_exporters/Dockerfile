FROM python:3

RUN apt-get update && apt-get -y upgrade

COPY ndex_webapp_python_exporters app

RUN cd app && \
    python3 -m pip install requests && \
	python3 -m pip install numpy && \
	python3 setup.py install
