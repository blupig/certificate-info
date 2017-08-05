# Minimum environment (can also be FROM scratch)
FROM alpine

# Install ca-certificates
RUN apk add --no-cache ca-certificates

# Copy built binary
COPY build/cert-info /app/cert-info

# Default command
CMD ["/app/cert-info"]
