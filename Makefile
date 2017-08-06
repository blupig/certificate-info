all:
	@echo "To create chrome extension package: make package"

package:
	@rm -f certificate-info.zip
	@zip -r certificate-info.zip certificate-info
