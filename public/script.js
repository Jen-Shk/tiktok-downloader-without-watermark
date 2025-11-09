document.addEventListener("DOMContentLoaded", () => {
    async function downloadContent() {
        const url = document.getElementById('tiktokUrl').value.trim();

        if (!url) {
            alert('Please Enter a TikTok URL');
            return;
        }

        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<p class="loading">Fetching data...</p>';
        const button = document.getElementById('fetchBtn');
        button.disabled = true;
        button.textContent = "Fetching...";

        try {
            // ✅ Call Node.js backend instead of TikWM
            const apiUrl = `/api/download?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('API request failed!');
            }

            const data = await response.json();

            // ✅ Node.js backend returns { success: true, data: {...} }
            if (!data.success) {
                throw new Error(data.message || 'Invalid TikTok URL or API error');
            }

            const content = data.data;
            const username = content.author?.nickname ? `@${content.author.nickname}` : '@unknown_user';
            const videoId = content.id || 'unknown_id';
            resultsDiv.innerHTML = '<div class="note">Preview and download your TikTok video or images below.</div>';

            // ✅ PREVIEW SECTION STAYS EXACTLY THE SAME
            // Handle Images (TikTok photo posts)
            if (content.images && content.images.length > 0) {
                const imageSection = document.createElement('div');
                imageSection.className = 'image-section';
                imageSection.innerHTML = '<h3>Image Previews:</h3>';

                const scrollContainer = document.createElement('div');
                scrollContainer.className = 'image-scroll-container';

                content.images.forEach((imgObj, index) => {
                    const imageWrapper = document.createElement('div');
                    imageWrapper.className = 'image-wrapper';

                    const img = document.createElement('img');
                    img.src = imgObj.url;
                    img.alt = `Image ${index + 1}`;
                    img.className = 'preview-img';
                    img.onclick = () => window.open(imgObj.url, '_blank');
                    imageWrapper.appendChild(img);

                    const imgBtn = createDownloadButton(
                        `Download Image ${index + 1}`,
                        imgObj.url,
                        imgObj.filename
                    );
                    imageWrapper.appendChild(imgBtn);

                    scrollContainer.appendChild(imageWrapper);
                });

                imageSection.appendChild(scrollContainer);
                resultsDiv.appendChild(imageSection);
            }

            // Handle Video
            if (content.video?.play) {
                const videoData = content.video;

                const getExt = (url) => url.endsWith('.mp3') ? '.mp3' : '.mp4';
                const ext = getExt(videoData.play);

                // Video Preview
                const videoPreview = document.createElement('video');
                videoPreview.src = videoData.play;
                videoPreview.controls = true;
                videoPreview.autoplay = false;
                videoPreview.loop = false;
                videoPreview.width = 300;
                videoPreview.className = 'preview-video';
                resultsDiv.appendChild(videoPreview);

                // Download Buttons
                if (videoData.play) {
                    resultsDiv.appendChild(createDownloadButton(
                        `Download Video (${ext})`,
                        videoData.play,
                        videoData.filename.replace(/\.(mp4|mp3)$/, ext)
                    ));
                }
            }

            // Thumbnail
            if (content.cover?.url) {
                const thumbPreview = document.createElement('img');
                thumbPreview.src = content.cover.url;
                thumbPreview.alt = 'Thumbnail';
                thumbPreview.className = 'preview-img';
                thumbPreview.style.width = '200px';
                thumbPreview.style.margin = '10px auto';
                resultsDiv.appendChild(thumbPreview);

                const thumbBtn = createDownloadButton(
                    'Download Thumbnail (JPG)',
                    content.cover.url,
                    content.cover.filename
                );
                resultsDiv.appendChild(thumbBtn);
            }

            if (!content.video && (!content.images || content.images.length === 0)) {
                throw new Error('No downloadable content found');
            }

        } catch (error) {
            resultsDiv.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            button.disabled = false;
            button.textContent = 'Download';
        }
    }

    function createDownloadButton(text, url, filename) {
        const btn = document.createElement('button');
        btn.className = 'download-btn';
        btn.textContent = text;
        btn.onclick = () => downloadFile(url, filename);
        return btn;
    }

    function downloadFile(url, filename) {
        // Use backend proxy to bypass CORS - backend handles all streaming
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
        
        // Create anchor element for direct native download
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.style.display = 'none';
        
        // Trigger download and cleanup
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    document.getElementById('pasteBtn').addEventListener('click', async function () {
        const pasteBtn = this;
        const input = document.getElementById('tiktokUrl');

        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                input.value = text;
                input.focus();
                pasteBtn.textContent = "✅ Pasted!";
                pasteBtn.style.backgroundColor = "#28a745";
                setTimeout(() => {
                    pasteBtn.textContent = "📋 Paste";
                    pasteBtn.style.backgroundColor = "#6c757d";
                }, 1500);
            } else alert("Clipboard is empty!");
        } catch (err) {
            input.focus();
            alert("Clipboard access denied! Please paste manually (Ctrl+V).");
        }
    });

    document.getElementById('fetchBtn').addEventListener('click', downloadContent);

    document.getElementById('tiktokUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') downloadContent();
    });

    document.getElementById('year').textContent = new Date().getFullYear();
});
