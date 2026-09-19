# Interplanetary Trajectory Physics Simulator 🚀

A realistic interplanetary physics simulator exploring orbital mechanics, planetary transfers, gravity assists, and deep-space trajectories through interactive 3D visualization.

## 🌌 Overview

This project combines classical orbital mechanics, numerical simulation, and interactive visualization to model spacecraft motion across the Solar System.

The simulator demonstrates how spacecraft can transfer between planetary orbits, use planetary gravity assists to alter their heliocentric velocity, and model complex orbital dynamics using numerical methods.

## ✨ Features

* 🪐 **Hohmann Transfer Orbits**

  * Calculates transfer orbits between planetary distances
  * Determines transfer velocity, Δv, and time of flight
  * Supports Earth → Mars and Earth → Jupiter examples

* 🚀 **Vector-Based Gravity Assist**

  * Calculates hyperbolic flyby characteristics
  * Determines hyperbolic eccentricity and deflection angle
  * Models incoming and outgoing spacecraft velocity vectors
  * Demonstrates the heliocentric velocity change produced by a Jupiter flyby

* ☀️ **Interplanetary Physics**

  * Keplerian orbital mechanics
  * Vis-viva equation
  * Solar and planetary gravitational parameters
  * Astronomical Unit/year and km/s unit conversions

* 🌍 **N-Body Numerical Integration**

  * RK4 numerical integration
  * Models gravitational interactions between celestial bodies
  * Supports numerical spacecraft trajectory propagation

* 🔭 **CR3BP Simulation**

  * Circular Restricted Three-Body Problem
  * Jacobi constant calculation
  * Lagrange point computation
  * Numerical trajectory integration
  * Supports multiple celestial-system presets

* 🎮 **Interactive 3D Visualization**

  * Real-time Solar System visualization
  * Cinematic mission sequence
  * Planetary flyby visualization
  * Mission telemetry and velocity display

## 🧮 Physics Models

### Hohmann Transfer

The simulator uses the classical Hohmann transfer equations to determine the transfer orbit between two circular planetary orbits.

For a transfer between radii \(r_1\) and \(r_2\):

$$
a_t = \frac{r_1+r_2}{2}
$$

The transfer velocity is calculated using the vis-viva equation:

$$
v = \sqrt{\mu\left(\frac{2}{r}-\frac{1}{a_t}\right)}
$$

The simulator also calculates the corresponding departure and arrival Δv values and transfer time.

### Gravity Assist

The Jupiter gravity-assist model uses a hyperbolic flyby approximation.

The hyperbolic eccentricity is:

$$
e = 1+\frac{r_pv_\infty^2}{\mu_p}
$$

and the turning angle is:

$$
\delta = 2\sin^{-1}\left(\frac{1}{e}\right)
$$

The outgoing spacecraft velocity is then obtained through vector addition of the planet's heliocentric velocity and the deflected spacecraft-relative velocity.

For the configured Jupiter example, the simulation produces approximately:

**+9.9 km/s heliocentric velocity change**

with an outgoing velocity of approximately:

**17.4 km/s**

## 🔬 CR3BP

The Circular Restricted Three-Body Problem models the motion of a spacecraft under the gravitational influence of two primary bodies while assuming the spacecraft has negligible mass.

The simulator calculates:

* L1, L2, L3, L4 and L5 equilibrium points
* Effective potential
* Jacobi constant
* Numerical trajectories using RK4 integration

Supported system presets include:

* Earth–Moon
* Sun–Earth
* Sun–Jupiter
* Saturn–Titan

## 🖥️ Interactive Visualization

The project includes a browser-based 3D visualization built with JavaScript and Three.js.

The visualization presents a cinematic mission sequence:

1. **Earth Departure**
2. **Deep-Space Transit**
3. **Jupiter Gravity Assist**
4. **Outer Solar System Trajectory**

Mission telemetry displays parameters such as spacecraft velocity, distance, and mission time.

## 📁 Project Structure

```text
interplanetary-trajectory-physics-simulator/
│
├── physics/
│   ├── interplanetary_physics_engine.py
│   └── cr3bp_physics_engine.py
│
├── telemetry/
│   └── cr3bp_telemetry_export.csv
│
├── web/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── documentation/
│   ├── PHYSICAL_THEORY.md
│   └── PRESENTATION_HANDOUT.md
│
└── README.md
```

## 🛠️ Technologies

* **Python**
* **NumPy**
* **Matplotlib**
* **JavaScript**
* **Three.js**
* **HTML5**
* **CSS3**
* **RK4 Numerical Integration**
* **Classical Orbital Mechanics**

## 🚀 Running the Physics Engine

Install the required Python packages:

```bash
pip install numpy matplotlib
```

Then run:

```bash
python physics/interplanetary_physics_engine.py
```

For the CR3BP simulation:

```bash
python physics/cr3bp_physics_engine.py
```

## 🌐 Running the 3D Visualization

Open:

```text
web/index.html
```

in a modern web browser.

For best results, run the web application through a local server rather than opening the HTML file directly.

## 📚 Documentation

Additional technical documentation is available in:

* [`PHYSICAL_THEORY.md`](documentation/PHYSICAL_THEORY.md) — mathematical and physical foundations
* [`PRESENTATION_HANDOUT.md`](documentation/PRESENTATION_HANDOUT.md) — project presentation material

## 🎯 Project Goals

The primary goal of this project is to bridge the gap between theoretical orbital mechanics and interactive computational simulation.

It demonstrates how mathematical models such as Hohmann transfers, hyperbolic flybys, N-body dynamics, and the CR3BP can be implemented computationally and visualized as spacecraft missions.

## ⚠️ Simulation Scope

The interplanetary mission examples use idealized orbital-mechanics and patched-conic assumptions. The gravity-assist demonstration uses a specified flyby geometry rather than solving a complete launch-window and planetary-phase optimization problem.

The visualization is intended to communicate the physics and mission sequence interactively, while the Python engines provide the underlying numerical calculations.

## 👨‍🚀 Project

**Interplanetary Trajectory Physics Simulator**

Built as a computational exploration of orbital mechanics, spacecraft trajectory design, and numerical simulation.
