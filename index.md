## Welcome to Assisted BPR Modeler

This project is modeler application for assisted Business Process Redesign (aBPR). aBPR is a JavaScript application that demonstrates the application of redesign patterns in BPR initiatives. It is an implementation of the reference architecture presented in *An assisted approach to business process redesign* (In Decision Support Systems, [10.1016/j.dss.2022.113749](https://doi.org/10.1016/j.dss.2022.113749)) and based on Camunda Modeler.

Quick links
- Download: [latest release](https://github.com/dtdi/assisted-bpr-modeler/releases/latest)
- [Short video demonstration](https://www.youtube.com/watch?v=HwXtz2mDHLw)
- [Tutorial document](https://github.com/dtdi/assisted-bpr-modeler/blob/gh-pages/aBPR%20Tutorial.pdf) 

## Getting started

Depending on your Windows plattform (32 bit vs. 64 bit), either download `camunda-modeler-5.0.0-abpr-win-x64.zip` or `camunda-modeler-5.0.0-abpr-win-ia32.zip` from [the latest release](https://github.com/dtdi/assisted-bpr-modeler/releases/latest) and extract the `.zip` file. In the extracted folder, you will find the `Camunda Modeler.exe` file that you can execute. Since the aBPR tool is an extension of the [Camunda Modeler](https://github.com/camunda/camunda-modeler), you can use the tool also to edit `.bpmn`, `.dmn` or `.form` files. The file extension for working with aBPR process diagrams is `.simubpmn` for simulable BPMN. 

## Video Demonstration

A short demonstration video is provided here:

<iframe width="560" height="315" src="https://www.youtube.com/embed/HwXtz2mDHLw" title="YouTube video player" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

An extended demonstration video is provided here:

<iframe src="https://www.youtube.com/embed/VqrHj7RaFXQ" 
    width="560" 
    height="315"
    frameborder="0" 
    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen>
</iframe>

## How it Works

The software prototype is a web application that starts from an empty canvas or from an existing BPMN diagram. It enables the user to annotate and edit a process model and recommends redesign options based on the process model and a defined performance objective (i.e., time, cost, quality, and flexibility). The user can then apply these recommendations and evaluate their impact with simulation experiments. This procedure is repeated until satisfaction with the process model is achieved. 
In our prototype, we support process redesign patterns by [Reijers & Limam Mansar (2005)](https://doi.org/10.1016/j.omega.2004.04.012) in varying levels of automation: The triage and activity automation patterns are implemented as guided advice, the parallelism and extra resources pattern are implemented as advice whereas the remaining are implemented as hints and ideas. 

1) Import or model a BPMN Business Process for improvement. 
![overall](https://user-images.githubusercontent.com/922917/125649915-accff879-538b-47b5-b75e-6a1ee47913ef.PNG)

2) After setting the performance objective, a list of recommendations indicates potential improvements to the process model, such as the parallelization of tasks.
![parallel_apply_1](https://user-images.githubusercontent.com/922917/125649930-efb88ab1-22aa-494a-a330-1e97e87995e9.png)

3) The recommendation can be automatically applied to the model. Changes to the process model are tracked. 
![parallel_apply_2](https://user-images.githubusercontent.com/922917/125649944-6f710924-63a5-4e76-b3a3-c8880f373e05.png)

4) Additional changes can be made to the model. 
![parallel_apply_3](https://user-images.githubusercontent.com/922917/125649954-d6c17dae-dd0b-4450-b59f-2153e45113f4.png)

5) A simulation experiment is executed in the background and helps to evaluate the impact on the performance objective. 
![parallel_apply_4](https://user-images.githubusercontent.com/922917/125649959-03ea9fc5-5403-463d-8a26-cd63f2755d11.png)

The procedure starts over allowing for an iterative improvement of the process model. 

## Further Resources

- [simuBPMN Help](simu-bpmn)

## Built with

* [Camunda Modeler](https://github.com/camunda/camunda-modeler) - An integrated modeling solution for BPMN and DMN based on bpmn.io.
* [Scylla](https://github.com/bptlab/scylla), an extensible BPMN process simulator. 
* [Fluent UI](https://github.com/microsoft/fluentui) -  A collection of utilities, React components, and web components for building web applications.
* And further dependencies as detailed in [THIRD_PARTY_NOTICES](https://github.com/dtdi/assisted-bpr-modeler/blob/v5.0.0-abpr/THIRD_PARTY_NOTICES)

## Contact

Tobias Fehrer ([@dtdi](https://twitter.com/dtdi_), [LinkedIn](https://www.linkedin.com/in/tobiasfehrer/), [tobias-fehrer.de](https://tobias-fehrer.de])
