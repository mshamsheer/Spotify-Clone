

// Audio element for playing songs
const currentSong = new Audio();
let songs = []; // Array to store the list of songs
let currFolder; // Variable to store the current folder

// Function to convert seconds to minutes and seconds format
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

// Function to fetch songs from a specified folder
async function fetchSongs(folder) {
    try {
        currFolder = folder;
        const response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        const htmlContent = await response.text();

        const div = document.createElement("div");
        div.innerHTML = htmlContent;

        const anchors = div.getElementsByTagName("a");
        songs = Array.from(anchors)
            .filter(element => element.href.endsWith(".mp3"))
            .map(element => element.href.split(`/${folder}/`)[1]);

        updatePlaylist(); // Update the playlist on the page
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

// Function to update the playlist on the page
function updatePlaylist() {
    const songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = " ";

    for (const song of songs) {
        const decodedSong = decodeURI(song.replaceAll("%20", " "));
        songUL.innerHTML += `<li>
            <img class="invert" src="img/music.svg" alt="">
            <div class="info">
                <div>${decodedSong}</div>
                <div>Sonu</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="">
            </div>
        </li>`;
    }

    // Attach an event listener to each song
    Array.from(songUL.getElementsByTagName("li")).forEach(li => {
        li.addEventListener("click", () => playMusic(li.querySelector(".info").firstElementChild.innerHTML.trim()));
    });
}

// Function to play a selected track
function playMusic(track, pause = false) {
    currentSong.src = `/${currFolder}/` + track;

    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// Function to display albums on the page
async function displayAlbums() {
    try {
        const response = await fetch(`http://127.0.0.1:5500/songs/`);
        const htmlContent = await response.text();

        const div = document.createElement("div");
        div.innerHTML = htmlContent;

        const anchors = div.getElementsByTagName("a");

        // Loop through the anchors and display albums
        Array.from(anchors).forEach(async e => {
            const cardContainer = document.querySelector(".cardContainer");

            if (e.href.includes("/songs")) {
                const folder = e.href.split("/").slice(-2)[1];
                const infoResponse = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                const info = await infoResponse.json();

               
                cardContainer.innerHTML += `<div data-folder="${folder}" class="card ">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141834" stroke-width="1.5" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${info.title}</h2>
                    <p>${info.description}</p>
                </div>`;
            }
        });

        // Load the playlist whenever a card is clicked
        document.querySelector(".cardContainer").addEventListener("click", async (event) => {
            const card = event.target.closest(".card");
            if (card) {
                const folder = card.dataset.folder;
                await fetchSongs(`songs/${folder}`);
                
                // Check if songs array is not empty before trying to play the first song
                if (songs.length > 0) {
                    playMusic(songs[0]);
                } else {
                    // If the folder is empty, stop the current song
                    currentSong.pause();
                    play.src = "img/play.svg";
                }
            }
        });
        
        
    } catch (error) {
        console.error("Error displaying albums:", error);
    }
}

// Function to set up event listeners
function setupEventListeners() {
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    previous.addEventListener("click", () => {
        currentSong.pause();
        const index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        currentSong.pause();
        const index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume img").src = document.querySelector(".volume img").src.replace("mute.svg", "volume.svg");
        }
    });

    // Add event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e=>{ 
        if(e.target.src.includes("volume.svg")){
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else{
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }

    })
    
}

// Main function to initialize the script
async function main() {
    try {
        // Fetch and display the NCS songs initially
        await fetchSongs("songs/ncs");
        playMusic(songs[0], true);
        
        // Display albums and set up event listeners
        displayAlbums();
        setupEventListeners();
    } catch (error) {
        console.error("Error in main function:", error);
    }
}

// Call the main function to start the script
main();
