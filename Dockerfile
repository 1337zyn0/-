FROM nginx:1.27-bookworm
#FROM node:23-alpine3.20

EXPOSE 80

# Install NVM and Node
# Use bash for the shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# update the repository sources list and install dependencies
RUN apt-get update \
    && apt-get install -y curl \
    && apt-get -y autoclean

# Create a script file sourced by both interactive and non-interactive bash shells
ENV BASH_ENV=/root/.bash_env
RUN touch "${BASH_ENV}"
RUN echo '. "${BASH_ENV}"' >> ~/.bashrc

# Download and install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | PROFILE="${BASH_ENV}" bash
RUN echo node > .nvmrc
RUN nvm install
RUN nvm use 23

# Configure Website
WORKDIR /usr/share/nginx/html
COPY src/ /usr/share/nginx/html

RUN npm install d3
RUN npm install -D tailwindcss@3
RUN npx tailwindcss -i ./customStyles.css -o ./output.css