# Build container
FROM golang:alpine

COPY . /go/src/github.com/blupig/certificate-info
WORKDIR /go/src/github.com/blupig/certificate-info

# Build application
RUN go get -v .
RUN CGO_ENABLED=0 GOOS=linux \
    go build -o /go/bin/certificate-info -a \
    -ldflags "-extldflags \"-static\""

# Minimum runtime container (can also be FROM scratch)
FROM alpine

# Install packages
RUN apk add --no-cache ca-certificates

# Copy built binary from build container
COPY --from=0 /go/bin/certificate-info /bin/certificate-info

# Default environment
ENV PORT="8000"

# Default command
CMD ["/bin/certificate-info"]
