var app = new Vue({
    el: '#app',
    data: {
        file: null,
        dropFiles: [],
        preview: null,
        isImageLarge: false,
        isImageUploaded: false,
        isUploadImageError: false,
    },
    methods: {
        previewUpload() {
            this.isImageLarge = false
            this.isImageUploaded = false
            this.isUploadImageError = false
            this.isImageSizeExceeded()
            if (!this.isImageLarge) {
                this.preview = URL.createObjectURL(this.file)
            } else {
                this.preview = null
                this.file = null
            }
        },
        isImageSizeExceeded() {
            var filesize = ((this.file.size / 1000) / 1000); //MB - use 1000 instead 1024
            this.isImageLarge = filesize > 3
        },
        clearBrowseImage() {
            this.file = null
            this.preview = null
        },
        async uploadImage() {
            if (this.file) {
                let uploadSignedURL = await axios.post('http://localhost:3000/signed-url/upload', {
                    filePath: this.file.name,
                    fileType: this.file.type
                }).catch(error => {
                    console.log(error)
                    this.isUploadImageError = true
                    this.file = null
                    this.preview = null
                })

                if (uploadSignedURL && 'url' in uploadSignedURL.data) {
                    let url = uploadSignedURL.data.url

                    let response = await axios.put(url, this.file, {
                        headers: {
                            "Content-Type": this.file.type
                        }
                    }).catch(error => {
                        console.log(error)
                        this.isUploadImageError = true
                        this.file = null
                        this.preview = null
                        return false
                    })
                    if (response) {
                        this.isImageUploaded = true
                        this.file = null
                        this.preview = null
                    }

                }






                // const xhr = new XMLHttpRequest();
                // xhr.open("PUT", url, true);
                // xhr.onload = () => {
                //     const status = xhr.status;
                //     if (status === 200) {
                //         alert("File is uploaded");
                //     } else {
                //         alert("Something went wrong!");
                //     }
                // };

                // xhr.onerror = () => {
                //     alert("Something went wrong");
                // };
                // xhr.setRequestHeader('Content-Type', this.file.type);
                // xhr.send(this.file);
            }
        }
    }

})