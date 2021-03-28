const host = "http://localhost:3000"
var app = new Vue({
    el: '#app',
    data: {
        file: null,
        // dropFiles: [],
        preview: null,
        isImageLarge: false,
        isImageUploaded: false,
        isUploadImageError: false,
        isLoading: false,
        images: [],
        expiredTimeUrl: 60,//second
        bucketName: '',
        buckets: [],
        timer: null,
        createdBucketName: null,
        createBucketError: null,
    },
    async mounted() {
        await this.getBuckets()
        this.bucketName = this.buckets[0]
        this.getImages()
    },
    methods: {
        countDowntime() {
            if (this.expiredTimeUrl > 0) {
                this.timer = setTimeout(() => {
                    this.expiredTimeUrl -= 1
                    this.countDowntime()
                }, 1000)
            } else {
                // refresh url
                this.getImages()
            }
        },
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
            this.isLoading = true
            if (this.file) {
                let uploadSignedURL = await axios.post(`${host}/bucket/${this.bucketName}/signed-url/upload`, {
                    fileName: this.file.name,
                    fileType: this.file.type,
                    bucketName: this.bucketName
                }).catch(error => {
                    console.log(error.response)
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
                        console.log(error.response)
                        this.isUploadImageError = true
                        this.file = null
                        this.preview = null
                        return false
                    })
                    if (response) {
                        this.isImageUploaded = true
                        this.file = null
                        this.preview = null
                        this.getImages()
                    }

                }
            }
            this.isLoading = false
        },
        async getImages() {
            this.expiredTimeUrl = 60
            this.images = []
            let imagesList = await axios.get(`${host}/bucket/${this.bucketName}/images`).catch(error => {
                console.log(error.response)
            })
            if (imagesList && 'data' in imagesList.data) {
                for (let i = 0; i < imagesList.data.data.length; i++) {
                    let m = imagesList.data.data[i]
                    let updatedDate = new Date(m.updated)
                    this.images.push({
                        name: m.name,
                        size: (m.size / 1000).toFixed(2),
                        updated: `${updatedDate.toLocaleDateString()} ${updatedDate.toLocaleTimeString()}`,
                        url: m.url
                    })
                }
            }
            if(this.timer != null){
                clearTimeout(this.timer)
            }
            this.countDowntime()
        },
        async getBuckets() {
            let bucketsList = await axios.get(`${host}/bucket`).catch(error => {
                console.log(error.response)
            })
            this.buckets = bucketsList.data.data
        },
        changeBucket() {
            this.isImageLarge = false
            this.isImageUploaded = false
            this.isUploadImageError = false
            this.getImages()
        },
        async addBucketCors(bucketName){
            this.isLoading = true
            await axios.post(`${host}/bucket/${bucketName}/cors`,{
                origin: window.location.origin
            }).catch(error => {
                console.log(error.response)
            })
            this.isLoading = false
            this.isUploadImageError = false
        },
        async createBucket(){
            this.isLoading = true
            let response = await axios.post(`${host}/bucket`,{
                bucketName: this.createdBucketName
            }).catch(error => {
                console.log(error.response)
                this.createBucketError = error.response.data.message.message
            })
            if (response){
                this.createBucketError = null
                this.addBucketCors(this.createdBucketName)
                await this.getBuckets()
                this.bucketName = this.createdBucketName
                this.getImages()
            }
            this.isImageLarge = false
            this.isImageUploaded = false
            this.isUploadImageError = false
            this.isLoading = false
            this.createdBucketName = null
        }
    }

})