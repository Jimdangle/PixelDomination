# Pixel Domination
Online MS PAINT with friends
## Table of Contents

- [Pixel Domination](#pixel-domination)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Features](#features)
  - [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Step-by-step guide](#step-by-step-guide)
  - [Usage](#usage)
  - [Technologies Used](#technologies-used)
  - [Project Structure](#project-structure)
  - [Challenges and Learning](#challenges-and-learning)
  - [Contributors](#contributors)

## Introduction

Welcome to Pixel Domination, a competitive pixel-art game inspired by Reddit's r/place and pixelplace.io. Created using the Python-based web framework, py4web, this game delivers a unique online multiplayer experience, fostering competition and collaboration among users as they vie for pixel domination.

Pixel Domination employs the power of Vue.js to handle the game's frontend and the canvas element for the interactive game board. This combination of technologies provides a seamless, responsive user interface that makes the game accessible and enjoyable for players of all levels.

Players are invited to create or join games on boards of varying sizes, ranging from 20x20 to 200x200 pixels. Once in a game, players can select from one of five colors and paint on the board at regular intervals. The objective of the game? To claim the most pixels on the board with your team's color. 

Whether you are a passionate pixel artist or a competitive player seeking to claim as much virtual territory as possible, Pixel Domination provides a platform to unleash your creativity and strategic skills.


## Features

Pixel Domination offers an array of features that provide an engaging and interactive user experience:

- **Homepage**: The homepage provides a comprehensive guide on how to play the game and create servers, making it easy for beginners to start their pixel domination journey.

- **Server Browser**: A dedicated page to search for active games. Join an existing game or create a new one with just a few clicks.

- **Custom Game Creation**: Users can set up a new board with a custom or auto-generated name, choose the board's size (ranging from 20x20 to 200x200 pixels), set the pixel placement interval (in seconds), and select the game's duration (options range from 1 to 72 hours).

- **Gameplay**: After joining a game, users select their color and double-click a pixel to color it. A cooldown period based on the game's settings applies before the next pixel can be placed.

- **Leaderboard and Chat**: On the game page, users can check the current leaderboard, participate in live chat with other players, and keep an eye on the countdown timer.

- **Interactive Board**: Players can drag the board for better positioning and zoom in for a close-up view of the pixel artwork.

- **Global Leaderboard**: A separate leaderboard page displays the scores for each color in every game, showing who's dominating the pixel world.

- **Player Statistics**: A detailed stats page provides insights into a player's activity. Track total clicks, the last game played, active pixels, color distribution, and more. A pie chart even breaks down the proportion of each color the player has placed.

Each feature of Pixel Domination is designed to enhance user engagement, creating a competitive and collaborative environment for all players.


## Installation

### Prerequisites

The game is developed using Python's `py4web` framework. You need to have Python 3.6+ installed on your system. If you do not have Python installed, you can download it from the [official site](https://www.python.org/downloads/).

### Step-by-step guide

Follow these steps to set up the environment:

1. **Install py4web**: You can install py4web using pip. Open a terminal and enter the following command:

    ```shell
    pip install py4web
    ```


2. **Launch py4web dashboard**: In your terminal, navigate to the directory where you installed py4web and start the py4web dashboard by running:

    ```shell
    py4web run apps
    ```

    This will start a server, and the py4web dashboard should now be accessible by navigating to `http://127.0.0.1:8000/_dashboard` in your web browser.

3. **Import the project**: In the py4web dashboard, navigate to the "Apps" tab and click on the "Import" button. Select "clone from web" and paste the gepo url (`git@github.com:Jimdangle/PixelDomination.git`) and click create.

That's it! You have successfully installed the py4web framework and imported the "Pixel Domination" project. Check the [Usage](#usage) section to understand how to run and play the game.


## Usage

Navigating through Pixel Domination is designed to be user-friendly and intuitive. Here is a quick guide on how to use the game:

1. **Home Page**: Start by visiting the home page where you'll find instructions on how to play the game and create servers. 

2. **Join/Create Game**: Navigate to the server browser page to see a list of active games. You can join any of these games or create your own. 

3. **Customize Your Game**: When creating a game, customize it by setting a unique name, choosing the size of the board, setting the pixel placement interval, and deciding the game duration. 

4. **Playing the Game**: Once inside a game, select a color and double-click a pixel on the board to color it. Remember, you'll have to wait for the cooldown period before you can place your next pixel. 

5. **Interact**: You can view the game leaderboard, chat with other players, or keep track of the countdown timer on the game page. 

6. **Explore**: Utilize the zoom feature to get a better view of the board or drag around the board to view different areas. 

7. **Leaderboards and Stats**: You can view the global leaderboard page to see scores from all games. Additionally, check your stats page to get a detailed insight into your game play including total clicks, last game played, active pixels, color distribution, and more. 

8. **Log Out**: When you're done playing, you can log out of the game.

Remember, the goal is to claim as many pixels as possible with your color. Enjoy the game!


## Technologies Used

**Py4web:** Used as our backend framework, [py4web](https://py4web.com/) is a Python-based web development tool that offers a simple yet effective solution for handling our database access, URL routing, sessions, and other backend requirements.

**Vue.js:** The frontend of our application was built using [Vue.js](https://vuejs.org/), a JavaScript framework designed specifically for crafting user interfaces.

**Bulma:** For our application's styling and aesthetics, we used [Bulma](https://bulma.io/), a CSS framework based on Flexbox. Bulma's ready-to-use components are both fully responsive and modular, providing us with an easy-to-use tool for achieving visual consistency throughout our project.

## Project Structure

The following is a high-level overview of the Pixel Domination project's structure:


- **databases/**: Contains the database files of the application, used to persistently store data.
- **static/**: This directory contains static files like CSS, JavaScript, images, and other assets used in the project.
- **templates/**: Contains HTML templates, which are used for rendering views in the application.
- **common.py**: Contains shared functionalities across the project.
- **controllers.py**: Houses the main application logic of the project.
- **models.py**: Contains the data models of the application, defining the database structure.
- **settings.py**: Contains global settings and configuration variables for the application.
- **README.md**: The file you're reading now, a guide to the project.


## Challenges and Learning

 Here are some of the notable challenges we faced and the valuable experiences we gained along the way:

- **Implementing Cool-down Mechanism**: Implementing a mechanism to restrict users from placing pixels immediately after one another was tricky. This challenge taught us more about time management and user restrictions within a game environment.

- **Efficient Rendering**: Rendering large 200x200 pixel boards without slowing down the browser was a considerable hurdle. We delved deeper into efficient rendering techniques and found that using linear algebra we could calculate the pixels the user is supposed to see at a given time and render just the pixels needed.

- **Real-Time Updates**: Implementing real-time updates for various game elements such as the leaderboard, chat, and the board itself was a challenge. It helped us to understand better the intricacies of real-time web applications.


## Contributors

- [Mark Arguinbaev](https://github.com/mgineson)
- [Cal Blanco](https://github.com/Jimdangle)
- [Will Hord](https://github.com/WillHord)
- [Isaac Leiva](https://github.com/ileiva1)
- [Frank Podraza](https://github.com/WeekieNHN)
