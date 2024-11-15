function loadVideo(element, link) {
  const htmlString = `
    <iframe
      width="100%"
      height="100%"
      src="${link}"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen>
    </iframe>
  `
  const template = document.createElement('template')
  template.innerHTML = htmlString

  const videoSection = element.parentElement.parentElement
  const videoBlueprint = element.parentElement

  videoSection.classList.add('video-aspect-ratio')
  videoBlueprint.remove()

  //This template syntax seems to be a bit special, the second item in the array is the actual iframe
  videoSection.appendChild(template.content.childNodes[1])
}
