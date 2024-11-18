from docutils import nodes
from docutils.parsers.rst import Directive


class YTVideo(Directive):
    arguments = 1
    final_argument_whitespace = False
    has_content = True

    def run(self):
        link = self.content[0]
        url = ""

        # Check if it's a YouTube link
        if "youtube.com" in link:
            uid = link.split("v=")[-1]
            # In case there are other arguments after the video link
            uid = uid.split("&")[0]
            url = f"https://www.youtube-nocookie.com/embed/{uid}"
        elif "youtu.be" in link:
            uid = link.split("/")[-1]
            # In case there are other arguments after the video link
            uid = uid.split("&")[0]
            url = f"https://www.youtube-nocookie.com/embed/{uid}"
        else:
            raise ValueError(f"Unidentified YouTube link: {link}")

        # HTML element
        out = f"""
        <section class="video-container" aria-label="Youtube video" style="width: 100%; min-height: max-content;">
            <div class="video-blueprint">
                <div style="display: flex; gap: 0.25rem; margin-bottom: 1rem; align-items: center;">
                <img src="/_static/youtube.svg" width="25">
                <span style="600">YOUTUBE</span>
                </div>
                <h4 style="margin-top: 0;">Video cannot be shown without your consent</h4>
                <p>We provide videos via YouTube. For these videos to be shown, you first have to give your consent. If you consent, data will be transferred to YouTube, cookies will be used, and the Google DoubleClick advertising network will be contacted. This may trigger further data processing operations. It cannot be ruled out that data will also be transferred to countries outside the European Economic Area.</p>
                <button class="primary-button" onclick="loadVideo(this, '{url}')">Consent</button>
                <p>You can withdraw your consent with immediate and future effect at any time by reloading the website.</p>
                <a href="/data-protection-policy.html#youtube" target="_blank">Learn more</a>
            </div>
        </section>
        """
        # Use a raw pass-through node
        node = nodes.raw("", out, format="html", **{"class": "socialpost"})
        return [node]


def setup(app):
    app.add_directive("ytvideo", YTVideo)
