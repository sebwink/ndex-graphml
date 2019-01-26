FROM sebwink/ndex-python-exporters

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

COPY server /server

WORKDIR /server

RUN npm i

RUN npm i -g nodemon

CMD ["nodemon", "ndex.graphml.js"]
