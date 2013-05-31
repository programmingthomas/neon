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
	"fmt"
	"bufio"
	"time"
)

//Handle a request to resize an image. Requests are in the form /splashes/imgname/width.jpg
//so the width is pulled out and the 3000px version is read.
func ProcessImageRequest(w http.ResponseWriter, r * http.Request) {
	if r.URL.Path != "/splashes/" {
		rSplit := strings.Split(r.URL.Path, "/")
		if len(rSplit) >= 4 {
			imageName := rSplit[2]
			imageRes, err := strconv.ParseInt(strings.Replace(rSplit[3], ".jpg", "", -1), 0, 0)
			imagePath := PathToClient + "/splashes/" + imageName + "/3000.jpg"
			if err == nil && imageRes < 3000 {
				if FileExists(PathToClient + "/splashes/" + imageName + "/3000.jpg") {
					lastModTime := LastMod(imagePath)
					if r.Header["If-Modified-Since"] != nil && Cache {
						//RFC1123 is the standard date format used with HTTP
						headerTime, _ := time.Parse(time.RFC1123, r.Header["If-Modified-Since"][0])
						if !headerTime.Before(lastModTime) {
							w.WriteHeader(http.StatusNotModified)
							return
						}
					}
					//Writer the header and content
					if (Cache) {
						w.Header().Add("Last-Modified", lastModTime.Format(time.RFC1123))
					}
					
					w.Header().Add("Content-Type", "image/jpeg")
					w.WriteHeader(200)
					file, _ := os.Open(PathToClient + "/splashes/" + imageName + "/3000.jpg")
					defer file.Close()
					img, _, _ := image.Decode(file)
					newImg := ScaleImageToWidth(img, int(imageRes))
					jpeg.Encode(w, newImg, nil)
					if SaveResizedImages {
						SaveImage(imageName, int(imageRes), newImg)
					}
				}
			}
		}
	}
	w.WriteHeader(404)
}

//Save an image to disk
func SaveImage(name string, width int, img image.Image) {
	fo, err := os.Create(fmt.Sprintf("%s/splashes/%s/%d.jpg", PathToClient, name, width))
	if err != nil {
		fmt.Print(err)
	}
	w := bufio.NewWriter(fo)
	jpeg.Encode(w, img, nil)
	w.Flush()
	defer fo.Close()
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