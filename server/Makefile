all:
	@CGO_ENABLED=0 GOOS=linux go build -o build/cert-info -a -ldflags '-extldflags "-static"' .
	@docker build -t yunzhu/cert-info .
	@docker push yunzhu/cert-info
