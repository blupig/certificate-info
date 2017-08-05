all:
	@CGO_ENABLED=0 GOOS=linux go build -o build/cert-info -a -ldflags '-extldflags "-static"' .
	@docker build -t yunzhu/certificate-info .

push:
	@docker push yunzhu/certificate-info
