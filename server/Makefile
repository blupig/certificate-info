all:
	@go build main.go

run:
	@go run main.go

docker-push:
	@docker build -t blupig/certificate-info .
	@docker push blupig/certificate-info
