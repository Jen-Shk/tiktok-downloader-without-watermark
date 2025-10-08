document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('downloadBtn')

    btn.onclick = async () => {
        const url = document.getElementById('url').value.trim()
        const resDiv = document.getElementById('result')
        resDiv.innerHTML = ''
        if(!url) return alert('Please enter a TikTok link')

        resDiv.innerHTML = '<p>Fetching video...</p>'
        try {
            const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)
            const data = await res.json()
            if(!data.data) return resDiv.innerHTML = '<p>Invalid TikTok URL.</p>'
            const videoUrl = data.data.play
            const cover = data.data.cover
            const title = data.data.title || "tiktok_video"
            resDiv.innerHTML = `
                <img src="${cover}" alt="thumbnail" style="width: 100%; border-radius: 10px; margin-bottom: 10px;">
                <p>${title}</p>
                <video controls src="${videoUrl}"></video>
                <button id="directDownload">Download Without Watermark</button>
            `
            document.getElementById('directDownload').onclick = async () => {
                const fileName = title.replace(/[^\w\s]/gi, '_').substring(0, 40) + ".mp4"
                const response = await fetch(videoUrl)
                const blob = await response.blob()
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = fileName
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(link.href)
            }
        } catch {
            resDiv.innerHTML = '<p>Failed to fetch video.</p>'
        }
    }

    // ===== Footer =====
    document.getElementById('year').textContent = new Date().getFullYear()
})