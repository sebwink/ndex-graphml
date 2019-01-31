ndex-graphml: ndex-python-exporters
	docker-compose build $@

ndex-python-exporters:
	cd docker/ndex_python_exporters && docker-compose build $@
