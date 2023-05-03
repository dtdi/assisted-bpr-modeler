# Assisted Business Process Redesign Modeler

A modeler application for assisted Business Process Redesign (aBPR). aBPR is a JavaScript application that demonstrates the application of redesign patterns in BPR initiatives.
It is an implementation of the reference architecture presented in An assisted approach to business process redesign (submitted to Decision Support Systems) and based on the client component of the [Camunda Modeler](https://github.com/camunda/camunda-modeler).

![App Screenshot](https://user-images.githubusercontent.com/922917/125647537-09db9217-a518-4590-bdd7-21e9832bd5e8.png)

## How it Works

The software prototype is a web application that starts from an empty canvas or from an existing BPMN diagram. It enables the user to annotate and edit a process model and recommends redesign options based on the process model and a defined performance objective (i.e., time, cost, quality, and flexibility). The user can then apply these recommendations and evaluate their impact with simulation experiments. This procedure is repeated until satisfaction with the process model is achieved. 
In our prototype, we support process redesign patterns by [Reijers & Limam Mansar (2005)](https://doi.org/10.1016/j.omega.2004.04.012) in varying levels of automation: The triage and activity automation patterns are implemented as guided advice, the parallelism and extra resources pattern are implemented as advice whereas the remaining are implemented as hints and ideas. 

### Love Process Redesign Patterns? 

[<img src="https://dtdi.de/ads/assisted-bpr-modeler.png" width="419px" />](https://dtdi.de/gh-ads.php?repo=assisted-bpr-modeler).

### 1) Import or model a BPMN Business Process for improvement. 
![overall](https://user-images.githubusercontent.com/922917/125649915-accff879-538b-47b5-b75e-6a1ee47913ef.PNG)

### 2) After setting the performance objective, a list of recommendations indicates potential improvements to the process model, such as the parallelization of tasks.
![parallel_apply_1](https://user-images.githubusercontent.com/922917/125649930-efb88ab1-22aa-494a-a330-1e97e87995e9.png)

### 3) The recommendation can be automatically applied to the model. Changes to the process model are tracked. 
![parallel_apply_2](https://user-images.githubusercontent.com/922917/125649944-6f710924-63a5-4e76-b3a3-c8880f373e05.png)

### 4) Additional changes can be made to the model. 
![parallel_apply_3](https://user-images.githubusercontent.com/922917/125649954-d6c17dae-dd0b-4450-b59f-2153e45113f4.png)

### 5) A simulation experiment is executed in the background and helps to evaluate the impact on the performance objective. 
![parallel_apply_4](https://user-images.githubusercontent.com/922917/125649959-03ea9fc5-5403-463d-8a26-cd63f2755d11.png)

The procedure starts over allowing for an iterative improvement of the process model. 

## Run the tool

The protype is available for demonstration under https://dtdi.de/abpr/demo 

A demonstration video is provided here:

[![Assisted Business Process Redesign Modeler - Demo](https://user-images.githubusercontent.com/922917/125797093-c36d0b6e-1cc5-45bf-8d0b-ecc9b45a59a6.png)](https://www.youtube.com/watch?v=VqrHj7RaFXQ)

## Install and Start the Application

Start the app in a Posix environment. On Windows that is Git Bash or WSL. Make sure you have installed all the [necessary tools](https://github.com/nodejs/node-gyp#installation) to install and compile Node.js C++ addons.

```sh
# install dependencies
npm install

# start the application
npm run start
```

In order to execute the simulation experiments, a web service is required that is per default hard coded in the sources and available at https://abpr.dtdi.de/. 

## Built with

* [Camunda Modeler](https://github.com/camunda/camunda-modeler) - An integrated modeling solution for BPMN and DMN based on bpmn.io.
* [Fluent UI](https://github.com/microsoft/fluentui) -  A collection of utilities, React components, and web components for building web applications.
* And further dependencies as detailed in [THIRD_PARTY_NOTICES](https://github.com/dtdi/assisted-bpr-modeler/blob/main/THIRD_PARTY_NOTICES)

Makes use of [Scylla](https://github.com/bptlab/scylla), an extensible BPMN process simulator. 


## Contact

- Tobias Fehrer ([@dtdi](https://twitter.com/dtdi_), [LinkedIn](https://www.linkedin.com/in/tobiasfehrer/))
