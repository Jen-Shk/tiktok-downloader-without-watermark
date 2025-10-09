document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const videoForm = document.getElementById('videoForm');
    const imagesForm = document.getElementById('imagesForm');
    const mainHeading = document.getElementById('mainHeading');
    const subHeading = document.getElementById('subHeading');
    const resultDiv = document.getElementById('result');
    
    let activeTab = 'video';
    
    // Function to update tabs
    function updateTab(tab) {
        if(tab === 'video') {
            videoForm.style.display = 'block';
            imagesForm.style.display = 'none';
            mainHeading.innerHTML = '<span>TikTok</span> Video Downloader';
            subHeading.textContent = 'Download TikTok videos without watermark instantly.';
        } else {
            videoForm.style.display = 'none';
            imagesForm.style.display = 'block';
            mainHeading.innerHTML = '<span>TikTok</span> Image Downloader';
            subHeading.textContent = 'Download TikTok images without watermark instantly.';
        }
        activeTab = tab;
        resultDiv.innerHTML = '';
    }
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateTab(tab.dataset.tab);
        });
    });

    // Initially show video tab
    updateTab('video');

    // ---------------- Video Tab Section ----------------
    document.getElementById('downloadVideoBtn').onclick = async () => {
        const url = document.getElementById('videoUrl').value.trim();
        resultDiv.innerHTML = '';
        if (!url) return alert('Please enter a TikTok video link');

        resultDiv.innerHTML = '<p>Fetching video...</p>';
        try {
            const videoRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const videoData = await videoRes.json();
            if (!videoData.data || !videoData.data.play) return resultDiv.innerHTML = '<p>Invalid TikTok video URL.</p>';
            
            const videoUrl = videoData.data.play;
            let title = videoData.data.title || "tiktok_video";
            title = title.replace(/[#@][\w]+/g, '').trim();
            title = title.replace(/[^\w\s]/gi, '').trim();

            resultDiv.innerHTML = `
                <p class="video-title">${title}</p>
                <video controls src="${videoUrl}" style="width:100%; border-radius:10px;"></video>
                <button id="downloadVideo">Download Video Without Watermark</button>
            `;

            document.getElementById('downloadVideo').onclick = async () => {
                try {
                    const fileName = title.replace(/[^\w\s]/gi, '_').substring(0, 40) + ".mp4";
                    const response = await fetch(videoUrl);
                    const blob = await response.blob();
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                } catch (err) {
                    alert("Failed to download video. Please try again.");
                    console.error(err);
                }
            };

        } catch (err) {
            console.error(err);
            resultDiv.innerHTML = '<p>Failed to fetch video.</p>';
        }
    };

    // ---------------- Image Tab Section ----------------
    document.getElementById('downloadImagesBtn').onclick = async () => {
        const url = document.getElementById('imagesUrl').value.trim();
        resultDiv.innerHTML = '';
        if (!url) return alert('Please enter a TikTok images link');

        resultDiv.innerHTML = '<p>Fetching images...</p>';
        try {
            const imgRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const imgData = await imgRes.json();
            if (!imgData.data || !imgData.data.images || imgData.data.images.length === 0) return resultDiv.innerHTML = '<p>No images found.</p>';

            let title = imgData.data.title || "tiktok_images";
            title = title.replace(/[#@][\w]+/g, '').trim();
            title = title.replace(/[^\w\s]/gi, '').trim();
            const safeTitle = title.replace(/[^\w\s]/gi, '_').substring(0, 40);

            const container = document.createElement('div');
            container.className = 'image-scroll-container';
            const checkboxes = [];

            imgData.data.images.forEach((imgUrl, i) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-wrapper';

                const imgEl = document.createElement('img');
                imgEl.src = imgUrl;
                imgEl.alt = `Image ${i+1}`;
                wrapper.appendChild(imgEl);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = true;
                checkbox.className = 'image-checkbox';
                wrapper.appendChild(checkbox);

                container.appendChild(wrapper);
                checkboxes.push({ checkbox, url: imgUrl });
            });

            resultDiv.innerHTML = `<p class="video-title">${title} (Images)</p>`;
            resultDiv.appendChild(container);

            const btnDownloadImages = document.createElement('button');
            btnDownloadImages.textContent = 'Download Selected Images';
            btnDownloadImages.style.marginTop = '10px';
            resultDiv.appendChild(btnDownloadImages);

            btnDownloadImages.onclick = async () => {
                const selectedImages = checkboxes.filter(c => c.checkbox.checked);
                if (selectedImages.length === 0) return alert('Please select at least one image!');

                for (let i = 0; i < selectedImages.length; i++) {
                    try {
                        const imgUrl = selectedImages[i].url;
                        const response = await fetch(imgUrl);
                        const blob = await response.blob();
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `${safeTitle}_${i+1}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(link.href);
                    } catch (err) {
                        console.error('Failed to download image:', err);
                        alert('Failed to download one of the images. Please try again.');
                    }
                }
            };

        } catch (err) {
            console.error(err);
            resultDiv.innerHTML = '<p>Failed to fetch images.</p>';
        }
    };

    // ---------------- Footer Section ----------------
    document.getElementById('year').textContent = new Date().getFullYear();
});
