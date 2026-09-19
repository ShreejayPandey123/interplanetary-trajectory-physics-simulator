# 🎓 30-SECOND PRESENTATION HANDOUT (READ THIS FOR YOUR SUBMISSION)

## 📌 Project Title
**Interplanetary Trajectory & Slingshot Gravity Assist Physics Simulator**

---

## ❓ 1. What problem does this project solve?
Spacecraft cannot carry enough rocket fuel to burn engines continuously across millions of kilometers. 
This simulator models how NASA space probes (like Voyager, Cassini, and Artemis) use **orbital geometry** and **planetary gravity** to travel across the solar system with **minimum fuel**.

---

## 📐 2. The 3 Core Physics Principles (Explained Simply)

### 1️⃣ Hohmann Transfer Orbit (Minimum Fuel Path)
Instead of flying in a straight line, the rocket fires its engine once at Earth to enter an **elliptical arc** that naturally intersects the target planet's orbit.

### 2️⃣ The Vis-Viva Equation ($v^2 = G M (2/r - 1/a)$) & Unit Conversion
This equation calculates spacecraft speed at any point in space. Speeds calculated in natural AU/year units are converted using the physical constant:
$$1 \text{ AU/year} = 4.74047 \text{ km/s}$$

### 3️⃣ Vector Gravity Assist (Free Speed Boost!)
When the probe passes near Jupiter:
- In Jupiter's frame, the relative velocity vector is bent by hyperbolic deflection angle $\delta = 2 \arcsin(1 / e_{\text{hyp}})$.
- In the Sun's frame, vector addition ($\mathbf{v}_{\text{sc, out}} = \mathbf{v}_{\text{Jupiter}} + \mathbf{v}_{\infty, \text{out}}$) transfers planetary momentum to the probe.
- **Result:** The spacecraft gains a vector-calculated **+9.9 km/s boost of heliocentric speed for FREE** without using a single drop of rocket fuel!

---

## 🚀 3. How to Present the Live 3D Simulation (3 Steps)
1. **Open `index.html`** in your browser.
2. **Click Any Flight Phase Button (01-04)**: The camera dynamically swoops and guides the viewer step-by-step through Earth launch, deep space transit, Jupiter slingshot, and solar system exit.
3. **Show Live Telemetry**: Point to the Heliocentric Speed HUD widget displaying real-time speed in km/s during the Jupiter flyby!
