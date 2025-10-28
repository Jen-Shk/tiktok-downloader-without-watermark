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
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('API request failed!');
            }

            const data = await response.json();

            if (data.code !== 0) {
                throw new Error(data.msg || 'Invalid TikTok URL or API error');
            }

            const content = data.data;
            const username = content.author?.unique_id? `@${content.author.unique_id}` : '@unknown_user';
            const videoId = content.id || 'unknown_id';

            resultsDiv.innerHTML = '<div class="note">Preview and download your TikTok video or images below. Please stay in this page while downloads complete.</div>';

            // Handle Images (TikTok photo posts)
            if (content.images && content.images.length > 0) {
                const imageSection = document.createElement('div');
                imageSection.className = 'image-section';
                imageSection.innerHTML = '<h3>Image Previews:</h3>';

                // Horizontal scroll container
                const scrollContainer = document.createElement('div');
                scrollContainer.className = 'image-scroll-container';

                content.images.forEach((imgUrl, index) => {
                    // Each image + download button wrapper
                    const imageWrapper = document.createElement('div');
                    imageWrapper.className = 'image-wrapper';

                    // Image preview
                    const img = document.createElement('img');
                    img.src = imgUrl;
                    img.alt = `Image ${index + 1}`;
                    img.className = 'preview-img';
                    img.onclick = () => window.open(imgUrl, '_blank'); // optional
                    imageWrapper.appendChild(img);

                    // Download button
                    const imgBtn = createDownloadButton(
                        `Download Image ${index + 1}`,
                        imgUrl,
                        `${username}_${videoId}_img${index + 1}.jpg`
                    );
                    imageWrapper.appendChild(imgBtn);

                    scrollContainer.appendChild(imageWrapper);
                });

                imageSection.appendChild(scrollContainer);
                resultsDiv.appendChild(imageSection);
            }

            // Handle Video
            if (content.play || content.hdplay) {
                const videoUrl = content.hdplay || content.play;

                let fileExtension = videoUrl.endsWith('.mp3') ? '.mp3' : '.mp4';

                // Video Preview
                const videoPreview = document.createElement('video');
                videoPreview.src = videoUrl;
                videoPreview.controls = true;
                videoPreview.autoplay = false;
                videoPreview.loop = false;
                videoPreview.width = 300;
                videoPreview.className = 'preview-video';
                resultsDiv.appendChild(videoPreview);

                // Download Buttons
                const videoBtn = createDownloadButton(
                    `Download ${fileExtension === '.mp3' ? 'Audio (MP3)' : 'Video (MP4)'}`,
                    videoUrl,
                    `${username}_${videoId}${fileExtension}`
                );
                resultsDiv.appendChild(videoBtn);

                if (content.cover) {
                    const thumbPreview = document.createElement('img');
                    thumbPreview.src = content.cover;
                    thumbPreview.alt = 'Thumbnail';
                    thumbPreview.className = 'preview-img';
                    thumbPreview.style.width = '200px';
                    thumbPreview.style.margin = '10px auto';
                    resultsDiv.appendChild(thumbPreview);

                    const thumbBtn = createDownloadButton(
                        'Download Thunbnail (JPG)',
                        content.cover,
                        `${username}_${videoId}_thumbnail.jpg`
                    );
                    resultsDiv.appendChild(thumbBtn);
                }
            }

            // If no video or images
            if (!content.play && !content.images) {
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
        btn.onclick = (event) => downloadFile(event, url, filename, text);
        return btn;
    }

    async function downloadFile(event, url, filename, originalText) {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = 'Downloading...';
    
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Fetch failed');
    
            const contentLength = Number(response.headers.get('content-length') || 0);
    
            if (response.body && 'getReader' in response.body && contentLength) {
                const reader = response.body.getReader();
                const chunks = [];
                let received = 0;
    
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    chunks.push(value);
                    received += value.length;
    
                    const percent = Math.floor((received / contentLength) * 100);
                    btn.textContent = `Downloading... ${percent}%`;  // ✅ live %
                }
    
                const blob = new Blob(chunks);
                const blobUrl = URL.createObjectURL(blob);
    
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } else {
                // fallback if stream not supported
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            }
    
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = originalText;
            }, 800);
    
        } catch (error) {
            console.warn('Direct fetch failed (likely CORS), using fallback link');
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.target = '_blank';
            a.textContent = `${originalText} (Fallback - Right-click to save)`;
            a.style.display = 'block';
            a.style.backgroundColor = '#dc3545';
            a.style.color = 'white';
            a.style.padding = '12px';
            a.style.textAlign = 'center';
            a.style.borderRadius = '5px';
            a.style.margin = '10px 0';
            a.style.textDecoration = 'none';
            a.style.fontWeight = 'bold';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
    
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }
        
    document.getElementById('pasteBtn').addEventListener('click', async function () {
        const pasteBtn = this;
        const input = document.getElementById('tiktokUrl');
    
        try {
            // Try to read from clipboard
            const text = await navigator.clipboard.readText();
    
            if (text) {
                input.value = text;
                input.focus();
    
                // Optional visual feedback
                pasteBtn.textContent = "✅ Pasted!";
                pasteBtn.style.backgroundColor = "#28a745";
    
                setTimeout(() => {
                    pasteBtn.textContent = "📋 Paste";
                    pasteBtn.style.backgroundColor = "#6c757d";
                }, 1500);
            } else {
                alert("Clipboard is empty!");
            }
    
        } catch (err) {
            // Fallback: prompt user to paste manually
            input.focus();
            alert("Clipboard access denied! Please paste manually (Ctrl+V).");
        }
    });

    document.getElementById('fetchBtn').addEventListener('click', downloadContent);

    // Allow Enter key to submit
    document.getElementById('tiktokUrl').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            downloadContent();
        }
    });

    // Footer Year
    document.getElementById('year').textContent = new Date().getFullYear();
});
