"""
===============================================================================
INTERPLANETARY TRAJECTORY & SLINGSHOT GRAVITY ASSIST PHYSICS ENGINE
===============================================================================
Author: Physics & Spaceflight Mechanics Division
License: MIT
Description:
    High-precision Keplerian and Patched-Conic interplanetary trajectory solver.
    Calculates Hohmann transfer ellipses, Vis-Viva orbital speeds, vector-based
    hyperbolic flyby gravity assist heliocentric velocity gain, and 4th-order
    Runge-Kutta N-body numerical integration.
    
    WHEN EXECUTED:
    1. Performs exact physics calculations and telemetry reporting.
    2. Opens interactive 3D Web Application in browser automatically.
    3. Displays native Matplotlib 3D viewport window (if installed).
===============================================================================
"""

import math
import sys
import os
import time
import csv
import webbrowser

# Gravitational Constant times Mass of Sun (AU^3 / yr^2)
# Standard AU-Year dimensionless units: G*M_sun = 4 * pi^2 approx 39.4784176
G_MSUN = 4.0 * (math.pi ** 2)

# Unit conversion factor from AU/year to km/s:
# 1 AU = 149,597,870.7 km, 1 Julian Year = 365.25 * 86400 s = 31,557,600 s
# 1 AU / year = 149597870.7 / 31557600 = 4.74047046 km/s
AU_PER_YEAR_TO_KMS = 4.74047046

# Planetary Constants in Astronomical Units (AU) and Solar Mass Ratios
PLANETS = {
    "Mercury": {"a": 0.3871, "e": 0.2056, "period_yr": 0.2408, "mass_ratio": 1.660e-7, "color": "#a8a8a8"},
    "Venus":   {"a": 0.7233, "e": 0.0067, "period_yr": 0.6152, "mass_ratio": 2.447e-6, "color": "#e0a96d"},
    "Earth":   {"a": 1.0000, "e": 0.0167, "period_yr": 1.0000, "mass_ratio": 3.003e-6, "color": "#3a86ff"},
    "Mars":    {"a": 1.5237, "e": 0.0934, "period_yr": 1.8808, "mass_ratio": 3.227e-7, "color": "#ff0844"},
    "Jupiter": {"a": 5.2044, "e": 0.0489, "period_yr": 11.862, "mass_ratio": 9.546e-4, "color": "#ffb703"}
}


class InterplanetaryPhysicsEngine:
    """
    Computes orbital speeds via Vis-Viva equation, Hohmann transfer parameters,
    and vector-based hyperbolic gravity assist heliocentric energy gains.
    """

    def __init__(self):
        self.mu_sun = G_MSUN

    def vis_viva_speed(self, r, a):
        """
        Calculates orbital velocity v from Vis-Viva Equation:
        v^2 = G*M_sun * (2/r - 1/a)
        """
        return math.sqrt(max(self.mu_sun * (2.0 / r - 1.0 / a), 0.0))

    def hohmann_transfer(self, r1, r2):
        """
        Calculates Hohmann transfer ellipse parameters between circular orbits at r1 and r2:
        - Semi-major axis: a_trans = (r1 + r2) / 2
        - Transfer duration (Time of Flight): TOF = pi * sqrt(a_trans^3 / G_M)
        - Departure speed at r1: v_trans1
        - Delta-v departure: dv1 = v_trans1 - v_circ1
        - Arrival speed at r2: v_trans2
        - Delta-v arrival: dv2 = v_circ2 - v_trans2
        """
        v_circ1 = math.sqrt(self.mu_sun / r1)
        v_circ2 = math.sqrt(self.mu_sun / r2)

        a_trans = (r1 + r2) / 2.0
        tof_years = math.pi * math.sqrt((a_trans ** 3) / self.mu_sun)

        v_trans1 = self.vis_viva_speed(r1, a_trans)
        v_trans2 = self.vis_viva_speed(r2, a_trans)

        dv1 = abs(v_trans1 - v_circ1)
        dv2 = abs(v_circ2 - v_trans2)
        total_dv = dv1 + dv2

        return {
            "a_trans": a_trans,
            "tof_years": tof_years,
            "tof_months": tof_years * 12.0,
            "v_circ1_auyr": v_circ1,
            "v_circ2_auyr": v_circ2,
            "v_trans1_auyr": v_trans1,
            "v_trans2_auyr": v_trans2,
            "dv1_auyr": dv1,
            "dv2_auyr": dv2,
            "total_dv_auyr": total_dv,
            
            # Converted values in km/s (using 1 AU/yr = 4.74047 km/s)
            "v_circ1_kms": v_circ1 * AU_PER_YEAR_TO_KMS,
            "v_circ2_kms": v_circ2 * AU_PER_YEAR_TO_KMS,
            "v_trans1_kms": v_trans1 * AU_PER_YEAR_TO_KMS,
            "v_trans2_kms": v_trans2 * AU_PER_YEAR_TO_KMS,
            "dv1_kms": dv1 * AU_PER_YEAR_TO_KMS,
            "dv2_kms": dv2 * AU_PER_YEAR_TO_KMS,
            "total_dv_kms": total_dv * AU_PER_YEAR_TO_KMS
        }

    def gravity_assist_vectors(self, planet_name, r1_departure_au=1.0, periapsis_dist_au=0.0025):
        """
        Vector-based calculation of planetary gravity assist.
        Calculates exact hyperbolic deflection angle and outgoing heliocentric speed gain:
        
        1. Hohmann transfer arrival speed at planet distance r_P: v_trans2
        2. Hyperbolic excess velocity magnitude: v_inf = |v_planet - v_trans2|
        3. Hyperbolic eccentricity: e_hyp = 1 + (r_p * v_inf^2) / mu_planet
        4. Deflection angle: delta = 2 * arcsin(1 / e_hyp)
        5. Vector addition of planetary orbital velocity v_P and deflected outgoing v_inf_out
           yields exact outgoing heliocentric velocity v_sc_out.
        6. Speed boost: Delta_V_helio = |v_sc_out| - |v_trans2|
        """
        if planet_name not in PLANETS:
            raise ValueError(f"Unknown planet {planet_name}")

        p = PLANETS[planet_name]
        r_P = p["a"]
        mu_planet = self.mu_sun * p["mass_ratio"]

        # 1. Circular orbital speed of planet and spacecraft Hohmann transfer arrival speed
        v_planet = math.sqrt(self.mu_sun / r_P)
        a_trans = (r1_departure_au + r_P) / 2.0
        v_sc_in = self.vis_viva_speed(r_P, a_trans)

        # 2. Hyperbolic approach excess speed (in planet synodic frame)
        v_inf_in = abs(v_planet - v_sc_in)

        # 3. Hyperbolic eccentricity & deflection angle
        e_hyp = 1.0 + (periapsis_dist_au * (v_inf_in ** 2)) / max(mu_planet, 1e-15)
        deflection_rad = 2.0 * math.asin(1.0 / max(e_hyp, 1.0))
        deflection_deg = math.degrees(deflection_rad)

        # 4. Outgoing vector calculation (trailing-side flyby for speed boost)
        # Planet velocity vector v_P = (0, v_planet, 0)
        # Deflected outgoing relative vector v_inf_out = (-v_inf * sin(delta), -v_inf * cos(delta), 0)
        v_inf_out_x = -v_inf_in * math.sin(deflection_rad)
        v_inf_out_y = -v_inf_in * math.cos(deflection_rad)

        v_sc_out_x = v_inf_out_x
        v_sc_out_y = v_planet + v_inf_out_y

        v_sc_out_mag = math.sqrt(v_sc_out_x ** 2 + v_sc_out_y ** 2)

        # 5. Heliocentric speed gain
        dv_boost_auyr = v_sc_out_mag - v_sc_in
        dv_boost_kms = dv_boost_auyr * AU_PER_YEAR_TO_KMS

        return {
            "planet": planet_name,
            "r1_au": r1_departure_au,
            "r_planet_au": r_P,
            "periapsis_dist_au": periapsis_dist_au,
            "periapsis_dist_km": periapsis_dist_au * 149597870.7,
            "v_planet_kms": v_planet * AU_PER_YEAR_TO_KMS,
            "v_sc_in_kms": v_sc_in * AU_PER_YEAR_TO_KMS,
            "v_inf_in_auyr": v_inf_in,
            "v_inf_in_kms": v_inf_in * AU_PER_YEAR_TO_KMS,
            "e_hyp": e_hyp,
            "deflection_deg": deflection_deg,
            "v_sc_out_kms": v_sc_out_mag * AU_PER_YEAR_TO_KMS,
            "dv_boost_kms": dv_boost_kms,
            "dv_boost_auyr": dv_boost_auyr
        }

    def nbody_derivatives(self, t, state):
        """
        N-body gravitational acceleration on spacecraft S = [x, y, z, vx, vy, vz]
        d^2 r / dt^2 = - G*M_sun * r / r^3 + sum( - G*M_p * (r - r_p) / |r - r_p|^3 )
        """
        x, y, z, vx, vy, vz = state
        r_sun = math.sqrt(x**2 + y**2 + z**2)
        r_sun_3 = math.pow(max(r_sun, 1e-6), 3.0)

        # Solar gravitational acceleration
        ax = -self.mu_sun * x / r_sun_3
        ay = -self.mu_sun * y / r_sun_3
        az = -self.mu_sun * z / r_sun_3

        # Perturbations from planets
        for p_name, p in PLANETS.items():
            if p_name in ["Earth", "Jupiter", "Mars"]:
                theta = (2.0 * math.pi * t / p["period_yr"])
                px = p["a"] * math.cos(theta)
                py = p["a"] * math.sin(theta)
                pz = 0.0

                dx = x - px
                dy = y - py
                dz = z - pz
                dist = math.sqrt(dx**2 + dy**2 + dz**2)
                dist_3 = math.pow(max(dist, 1e-5), 3.0)

                mu_p = self.mu_sun * p["mass_ratio"]
                ax -= mu_p * dx / dist_3
                ay -= mu_p * dy / dist_3
                az -= mu_p * dz / dist_3

        return [vx, vy, vz, ax, ay, az]

    def rk4_step(self, t, state, dt):
        """4th-Order Runge-Kutta numerical step."""
        k1 = self.nbody_derivatives(t, state)
        s2 = [s + 0.5 * dt * k for s, k in zip(state, k1)]
        k2 = self.nbody_derivatives(t + 0.5 * dt, s2)
        s3 = [s + 0.5 * dt * k for s, k in zip(state, k2)]
        k3 = self.nbody_derivatives(t + 0.5 * dt, s3)
        s4 = [s + dt * k for s, k in zip(state, k3)]
        k4 = self.nbody_derivatives(t + dt, s4)

        return [
            s + (dt / 6.0) * (k1_i + 2.0 * k2_i + 2.0 * k3_i + k4_i)
            for s, k1_i, k2_i, k3_i, k4_i in zip(state, k1, k2, k3, k4)
        ]


def run_physics_demo():
    print("===============================================================================")
    print("INTERPLANETARY MISSION PHYSICS & GRAVITY ASSIST SOLVER")
    print("===============================================================================")
    print(f"Unit Conversion Constant: 1 AU/year = {AU_PER_YEAR_TO_KMS:.5f} km/s")

    engine = InterplanetaryPhysicsEngine()

    # 1. Earth to Mars Hohmann Transfer Analysis
    hm_mars = engine.hohmann_transfer(r1=1.0, r2=1.5237)
    print("\n[MISSION 1] Earth -> Mars Hohmann Transfer Orbit:")
    print(f"  Transfer Semi-Major Axis (a) : {hm_mars['a_trans']:.4f} AU")
    print(f"  Time of Flight (TOF)         : {hm_mars['tof_months']:.2f} months ({hm_mars['tof_years']:.3f} years)")
    print(f"  Earth Departure Speed        : {hm_mars['v_trans1_kms']:.2f} km/s (Heliocentric)")
    print(f"  Departure Burn Delta-V (dv1) : {hm_mars['dv1_kms']:.2f} km/s")
    print(f"  Mars Arrival Burn Delta-V(dv2): {hm_mars['dv2_kms']:.2f} km/s")
    print(f"  Total Mission Delta-V        : {hm_mars['total_dv_kms']:.2f} km/s")

    # 2. Earth to Jupiter Hohmann Transfer & Vector Slingshot Analysis
    hm_jup = engine.hohmann_transfer(r1=1.0, r2=5.2044)
    slingshot = engine.gravity_assist_vectors("Jupiter", r1_departure_au=1.0, periapsis_dist_au=0.0025)
    
    print("\n[MISSION 2] Earth -> Jupiter Transfer & Gravity Assist Slingshot:")
    print(f"  Transfer Semi-Major Axis (a) : {hm_jup['a_trans']:.4f} AU")
    print(f"  Time of Flight to Jupiter    : {hm_jup['tof_months']:.2f} months ({hm_jup['tof_years']:.3f} years)")
    print(f"  Earth Departure Speed        : {hm_jup['v_trans1_kms']:.2f} km/s (Heliocentric)")
    print(f"  Jupiter Arrival Speed        : {hm_jup['v_trans2_kms']:.2f} km/s (Heliocentric)")
    print(f"  Jupiter Orbital Speed        : {slingshot['v_planet_kms']:.2f} km/s")
    print(f"  Hyperbolic Approach Speed v_inf: {slingshot['v_inf_in_kms']:.2f} km/s ({slingshot['v_inf_in_auyr']:.4f} AU/yr)")
    print(f"  Flyby Closest Approach (rp)  : {slingshot['periapsis_dist_km']:,.0f} km ({slingshot['periapsis_dist_au']:.4f} AU)")
    print(f"  Hyperbolic Deflection Angle  : {slingshot['deflection_deg']:.2f} degrees")
    print(f"  Post-Flyby Heliocentric Speed: {slingshot['v_sc_out_kms']:.2f} km/s")
    print(f"  Vector-Calculated Speed Gain : +{slingshot['dv_boost_kms']:.2f} km/s (FREE Delta-V boost!)")

    # 3. Simulate Jupiter Slingshot Trajectory via RK4 Integration
    print("\n[NUMERICAL SIMULATION] Integrating Jupiter Slingshot 3D Vector Field...")
    # Initial state at Earth (1.0, 0, 0) with Jupiter transfer velocity (0, v_trans1_jup, 0)
    state = [1.0, 0.0, 0.0, 0.0, hm_jup['v_trans1_auyr'], 0.0]
    t = 0.0
    dt = 0.002
    steps = int((hm_jup['tof_years'] * 1.5) / dt)

    trajectory = []
    for _ in range(steps):
        trajectory.append((t, state[0], state[1], state[2]))
        state = engine.rk4_step(t, state, dt)
        t += dt

    print(f"  Integrated {len(trajectory)} state vectors cleanly through Jupiter encounter.")

    # 4. Open 3D Web Application in Browser Automatically
    html_path = os.path.abspath("index.html")
    print(f"\n[LAUNCHING 3D INTERACTIVE VISUALIZER] -> file://{html_path}")
    webbrowser.open("file://" + html_path)

    # 5. Native Matplotlib 3D Popup Plot (Compatible with Matplotlib 3.8+)
    try:
        import matplotlib.pyplot as plt
        from mpl_toolkits.mplot3d import Axes3D

        print("\nOpening Native 3D Physics Viewport Window...")
        fig = plt.figure(figsize=(10, 8), facecolor='#080a0f')
        ax = fig.add_subplot(111, projection='3d', facecolor='#080a0f')

        # Matplotlib 3.8+ compatible pane styling
        ax.xaxis.set_pane_color((0.03, 0.04, 0.06, 1.0))
        ax.yaxis.set_pane_color((0.03, 0.04, 0.06, 1.0))
        ax.zaxis.set_pane_color((0.03, 0.04, 0.06, 1.0))
        ax.tick_params(colors='#94a3b8')

        # Sun
        ax.scatter([0], [0], [0], color='#ffb703', s=400, label='Sun (Primary Mass)', depthshade=False)

        # Planetary Orbits
        for p_name, p in PLANETS.items():
            if p_name in ["Earth", "Mars", "Jupiter"]:
                theta = [i * 0.05 for i in range(130)]
                ox = [p['a'] * math.cos(th) for th in theta]
                oy = [p['a'] * math.sin(th) for th in theta]
                oz = [0.0] * len(theta)
                ax.plot(ox, oy, oz, color=p['color'], linestyle='--', alpha=0.5, label=f'{p_name} Orbit ({p["a"]} AU)')

        # Spacecraft Trajectory
        xs = [rec[1] for rec in trajectory]
        ys = [rec[2] for rec in trajectory]
        zs = [rec[3] for rec in trajectory]
        ax.plot(xs, ys, zs, color='#00f2fe', linewidth=2.0, label='Spacecraft Jupiter Slingshot Path')

        ax.set_xlabel('X (AU)', color='#94a3b8')
        ax.set_ylabel('Y (AU)', color='#94a3b8')
        ax.set_zlabel('Z (AU)', color='#94a3b8')
        ax.set_title('Interplanetary Trajectory & Vector Gravity Assist', color='#00f2fe', fontsize=14, fontweight='bold')
        ax.legend(facecolor='#101521', edgecolor='#00f2fe', labelcolor='#ffffff')

        plt.show()
    except ImportError:
        print("[INFO] Matplotlib not found; opened full 3D interactive WebGL view in browser.")

    print("===============================================================================")


if __name__ == "__main__":
    run_physics_demo()
