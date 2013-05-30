//Handles image resizing
package neonserver

import (
	"image"
	"image/color"
	"image/jpeg"
	"strings"
	"strconv"
	"os"
	"net/http"
	"time"
	"fmt"
)

//Handle a request to resize an image. Requests are in the form /splashes/imgname/width.jpg
//so the width is pulled out and the 3000px version is read. Please note it will 
//automatically round up to the nearest 100
func ProcessImageRequest(w http.ResponseWriter, r * http.Request) {
	if r.URL.Path != "/splashes/" {
		rSplit := strings.Split(r.URL.Path, "/")
		if len(rSplit) >= 4 {
			imageName := rSplit[2]
			imageRes, err := strconv.ParseInt(strings.Replace(rSplit[3], ".jpg", "", -1), 0, 0)
			if err == nil && imageRes < 3000 {
				if FileExists(PathToClient + "/splashes/" + imageName + "/3000.jpg") {
					//TODO If-Modified-Since
					w.Header().Add("Content-Type", "image/jpeg")
					w.WriteHeader(200)
					startTime := time.Now()
					file, _ := os.Open(PathToClient + "/splashes/" + imageName + "/3000.jpg")
					defer file.Close()
					img, _, _ := image.Decode(file)
					imageLoadTime := time.Now()
					warn("Image", fmt.Sprintf("Loaded in \t %f s", imageLoadTime.Sub(startTime).Seconds()))
					newImg := ScaleImageToWidth(img, Nearest(int(imageRes), 100))
					imageScaleTime := time.Now()
					warn("Image", fmt.Sprintf("Scaled in \t %f s", imageScaleTime.Sub(imageLoadTime).Seconds()))
					jpeg.Encode(w, newImg, nil)
					imageEncodeTime := time.Now()
					warn("Image", fmt.Sprintf("Wrote in \t %f s", imageEncodeTime.Sub(imageScaleTime).Seconds()))
				} else {
					w.WriteHeader(404)
					e("Image", imageName + " doesn't exist")
				}
			} else {
				w.WriteHeader(404)
				e("Image", "Int failed " + rSplit[3])
			}
		} else {
			w.WriteHeader(404)
			e("Image", "Not correct length")
		}
	} else {
		w.WriteHeader(404)
		e("Image", "Not splash request")
	}
}

//Round something up to the nearest of that unit (101, 100 -> 200, 99, 100 -> 100)
func Nearest(val, unit int) int {
	return val + (unit - val % unit)
}

//This function will resample an image by fetching the closest pixel
//This is *not* a very accurate or beautiful way of resizing an image but for the
//majority of images it will work
func ScaleImageToWidth(img image.Image, width int) image.Image {
	oWidth := img.Bounds().Size().X
	oHeight := img.Bounds().Size().Y
	ratio := float64(width) / float64(oWidth)
	newHeight := int(ratio * float64(oHeight))
	newImg := image.NewRGBA(image.Rect(0, 0, width, newHeight))
	for y := 0; y < newHeight; y++ {
		for x := 0; x < width; x++ {
			ox := int(float64(x) / ratio)
			oy := int(float64(y) / ratio)
			r32, g32, b32, a32 := img.At(ox, oy).RGBA()
			newImg.SetRGBA(x, y, color.RGBA{uint8(r32 >> 8), uint8(g32 >> 8), uint8(b32 >> 8), uint8(a32 >> 8)})
		}
	}
	return newImg
}