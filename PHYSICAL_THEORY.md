# Physical Mechanics of Interplanetary Trajectories & Gravitational Assists

## 0. Submission Presentation Cheat Sheet (Read This for Your Presentation!)

If you need to explain this project during your submission, here are the 3 core takeaways:

1. **What is a Hohmann Transfer?**
   - It is the most fuel-efficient elliptical orbit path used to send a rocket from one planet (e.g. Earth at $1.0 \text{ AU}$) to another (e.g. Mars or Jupiter).
   - Rather than burning fuel the whole way, the rocket fires its engines once at Earth ($\Delta v_1$) to get into the transfer ellipse, then coasts freely across deep space.

2. **What is the Vis-Viva Equation & Unit Conversion?**
   - Formula: $v^2 = G M_{\odot} \left( \frac{2}{r} - \frac{1}{a} \right)$.
   - Calculates exact spacecraft speed at any distance $r$ from the Sun. As the probe travels outward away from the Sun, solar gravity continuously slows it down.
   - **Unit System**: Natural astronomical units use AU for length and years for time ($G M_{\odot} = 4\pi^2 \approx 39.4784 \text{ AU}^3/\text{yr}^2$).
   - **Unit Conversion Constant**: $1 \text{ AU/year} = \frac{149,597,870.7 \text{ km}}{31,557,600 \text{ s}} \approx 4.74047 \text{ km/s}$.

3. **What is a Vector Slingshot Gravity Assist?**
   - When the probe passes close to Jupiter, Jupiter's gravity bends its flight path by deflection angle $\delta = 2 \arcsin \left( \frac{1}{1 + \frac{r_p v_{\infty}^2}{G m_p}} \right)$.
   - Transforming relative hyperbolic velocity back to the heliocentric frame ($\mathbf{v}_{\text{sc, out}} = \mathbf{v}_P + \mathbf{v}_{\infty, \text{out}}$), the spacecraft **steals an infinitesimal fraction of Jupiter's orbital momentum**, gaining a vector-calculated $+9.9 \text{ km/s}$ boost in heliocentric speed **WITHOUT burning any rocket fuel**!

---

## 1. Executive Summary

Interplanetary spaceflight relies on **Keplerian Two-Body Dynamics**, **Patched-Conic Approximations**, and **Vector Gravitational Assists (Slingshot Flybys)** to travel across the solar system with minimal propellant consumption. 

This document details the mathematical physics behind **Hohmann Transfer Orbits**, the **Vis-Viva Equation**, **Unit Conversion Dynamics**, and **Hyperbolic Slingshot Flyby Deflections** where a spacecraft absorbs a fraction of a planet's orbital momentum to accelerate in the heliocentric reference frame.

---

## 2. Keplerian Dynamics & The Vis-Viva Equation

In a heliocentric coordinate system with central solar mass $M_{\odot}$, the specific mechanical energy $\epsilon$ of an orbiting body at distance $r$ with velocity $v$ is conserved:

$$\epsilon = \frac{1}{2}v^2 - \frac{G M_{\odot}}{r} = -\frac{G M_{\odot}}{2a}$$

where $a$ is the semi-major axis of the elliptical orbit. Rearranging yields the fundamental **Vis-Viva Equation**:

$$v^2 = G M_{\odot} \left( \frac{2}{r} - \frac{1}{a} \right)$$

### Dimensionless Units & Velocity Conversion:
- **Solar Gravitational Parameter**: $G M_{\odot} = 4\pi^2 \approx 39.4784176 \text{ AU}^3/\text{yr}^2$.
- **Speed Unit Conversion**:
  $$1 \text{ AU/year} = \frac{149,597,870.7 \text{ km}}{365.25 \times 86,400 \text{ s}} = 4.74047046 \text{ km/s}$$
- **Earth Circular Speed**: $v_{\text{Earth}} = \sqrt{G M_{\odot} / 1.0} = 2\pi \approx 6.283185 \text{ AU/yr} = 6.283185 \times 4.74047 \approx 29.78 \text{ km/s}$.

---

## 3. Hohmann Transfer Ellipse Physics

A **Hohmann Transfer** is the most fuel-efficient two-impulse maneuver to transfer a spacecraft between two co-planar circular orbits of radii $r_1$ (e.g. Earth at $1.0 \text{ AU}$) and $r_2$ (e.g. Mars at $1.524 \text{ AU}$ or Jupiter at $5.204 \text{ AU}$).

### 1. Semi-Major Axis of Transfer Ellipse:
$$a_{\text{trans}} = \frac{r_1 + r_2}{2}$$

### 2. Time of Flight (TOF):
Using Kepler's Third Law ($T^2 = \frac{4\pi^2}{GM} a^3$), the transfer duration is half the orbital period of the transfer ellipse:
$$T_{\text{trans}} = \frac{1}{2} T = \pi \sqrt{\frac{a_{\text{trans}}^3}{G M_{\odot}}}$$

- **Earth $\to$ Mars**: $a_{\text{trans}} \approx 1.26185 \text{ AU} \implies T_{\text{trans}} \approx 0.709 \text{ years} \approx 8.50 \text{ months}$.
- **Earth $\to$ Jupiter**: $a_{\text{trans}} \approx 3.1022 \text{ AU} \implies T_{\text{trans}} \approx 2.731 \text{ years} \approx 32.77 \text{ months}$.

### 3. Impulsive Velocity Adjustments ($\Delta v$):
- **Departure Burn ($\Delta v_1$) at $r_1$**:
  $$v_{\text{trans}, 1} = \sqrt{G M_{\odot} \left(\frac{2}{r_1} - \frac{1}{a_{\text{trans}}}\right)}$$
  $$\Delta v_1 = |v_{\text{trans}, 1} - v_{\text{circ}, 1}|$$

- **Arrival Insertion Burn ($\Delta v_2$) at $r_2$**:
  $$v_{\text{trans}, 2} = \sqrt{G M_{\odot} \left(\frac{2}{r_2} - \frac{1}{a_{\text{trans}}}\right)}$$
  $$\Delta v_2 = |v_{\text{circ}, 2} - v_{\text{trans}, 2}|$$

---

## 4. Vector Gravity Assist Mechanics (Slingshot)

A **Gravity Assist** uses the gravitational field of a moving planet $m_p$ to alter the magnitude and direction of a spacecraft's heliocentric velocity vector without expending rocket propellant.

### 1. Planet-Centric Hyperbolic Deflection
In Jupiter's reference frame, the spacecraft approaches with excess hyperbolic velocity $\mathbf{v}_{\infty, \text{in}}$ at closest approach distance $r_p$ (periapsis).

The hyperbolic eccentricity $e_{\text{hyp}}$ is:
$$e_{\text{hyp}} = 1 + \frac{r_p v_{\infty}^2}{G m_p}$$

The deflection angle $\delta$ through which the velocity vector rotates in the planet-centric frame is:
$$\delta = 2 \arcsin \left( \frac{1}{e_{\text{hyp}}} \right)$$

### 2. Heliocentric Vector Addition & Speed Boost
Transforming back to the **Sun's (Heliocentric) Frame**, the spacecraft's outgoing velocity $\mathbf{v}_{\text{sc, out}}$ is computed via vector addition:

$$\mathbf{v}_{\text{sc, out}} = \mathbf{v}_{\text{planet}} + \mathbf{v}_{\infty, \text{out}}$$

For a trailing-side flyby near Jupiter ($r_p = 0.0025 \text{ AU} \approx 374,000 \text{ km}$):
- Approach relative speed: $v_{\infty} = v_{\text{Jupiter}} - v_{\text{trans}, 2} = 2.7543 - 1.5638 = 1.1905 \text{ AU/yr} = 5.64 \text{ km/s}$.
- Deflection angle: $\delta \approx 132.14^\circ$.
- Outgoing heliocentric speed: $v_{\text{sc, out}} = 3.661 \text{ AU/yr} = 17.36 \text{ km/s}$.
- **Net Heliocentric Speed Gain**:
  $$\Delta V_{\text{boost}} = v_{\text{sc, out}} - v_{\text{trans}, 2} = 17.36 - 7.41 = +9.94 \text{ km/s}$$

---

## 5. Summary Table of Solar System Flyby Parameters

| Target Planet | Mass Ratio ($m_p / M_{\odot}$) | Orbital Radius (AU) | Vector-Calculated Speed Gain ($\Delta V$) |
|---|---|---|---|
| **Venus** | $2.447 \times 10^{-6}$ | $0.723$ | $+2.9 \text{ km/s}$ |
| **Earth** | $3.003 \times 10^{-6}$ | $1.000$ | $+3.4 \text{ km/s}$ |
| **Mars** | $3.227 \times 10^{-7}$ | $1.524$ | $+0.9 \text{ km/s}$ |
| **Jupiter** | $9.546 \times 10^{-4}$ | $5.204$ | $+9.9 \text{ km/s}$ |
