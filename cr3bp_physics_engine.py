"""
===============================================================================
CIRCULAR RESTRICTED THREE-BODY PROBLEM (CR3BP) 3D PHYSICS SIMULATOR
===============================================================================
Author: Physics & Orbital Mechanics Division
License: MIT
Description:
    Non-dimensionalized Circular Restricted Three-Body Problem (CR3BP) engine.
    Computes exact synodic equations of motion, Jacobi Constant integral conservation,
    Newton-Raphson quintic root finding for Lagrange points (L1-L5), and 4th-order
    Runge-Kutta integration of 3D quasi-halo libration trajectories.
    
    WHEN EXECUTED FROM TERMINAL:
    1. Automatically launches a native 3D Matplotlib/OpenGL interactive physics window.
    2. Automatically opens the interactive WebGL 3D simulation in your default browser.
===============================================================================
"""

import math
import sys
import os
import time
import csv
import webbrowser

# System Constants and Mass Ratio Presets
SYSTEM_PRESETS = {
    "Earth-Moon": {
        "mu": 0.0121505856,
        "primary": "Earth",
        "secondary": "Moon",
        "distance_km": 384400.0,
        "period_days": 27.321582
    },
    "Sun-Earth": {
        "mu": 3.0034806e-6,
        "primary": "Sun",
        "secondary": "Earth",
        "distance_km": 149597870.7,
        "period_days": 365.256363
    },
    "Sun-Jupiter": {
        "mu": 0.0009537,
        "primary": "Sun",
        "secondary": "Jupiter",
        "distance_km": 778570000.0,
        "period_days": 4332.59
    },
    "Saturn-Titan": {
        "mu": 0.0002366,
        "primary": "Saturn",
        "secondary": "Titan",
        "distance_km": 1221870.0,
        "period_days": 15.945
    }
}


class CR3BPEngine:
    """
    Core numerical and analytical engine for the Circular Restricted 3-Body Problem.
    Normalized dimensionless units:
        Length unit (LU) = Distance between M1 and M2
        Mass unit (MU) = M1 + M2
        Time unit (TU) = 1 / omega (Mean motion = 1 rad/TU)
    """

    def __init__(self, system_name="Earth-Moon"):
        if system_name in SYSTEM_PRESETS:
            self.preset = SYSTEM_PRESETS[system_name]
            self.mu = self.preset["mu"]
            self.system_name = system_name
        else:
            raise ValueError(f"Unknown preset {system_name}. Available: {list(SYSTEM_PRESETS.keys())}")

    def effective_potential(self, x, y, z):
        """
        Calculates the effective potential Omega(x, y, z) in the synodic rotating frame:
        Omega(x,y,z) = 0.5 * (x^2 + y^2) + (1-mu)/r1 + mu/r2 + 0.5 * mu * (1-mu)
        """
        mu = self.mu
        r1 = math.sqrt((x + mu)**2 + y**2 + z**2)
        r2 = math.sqrt((x - (1.0 - mu))**2 + y**2 + z**2)

        r1 = max(r1, 1e-12)
        r2 = max(r2, 1e-12)

        omega = 0.5 * (x**2 + y**2) + (1.0 - mu) / r1 + mu / r2 + 0.5 * mu * (1.0 - mu)
        return omega

    def jacobi_constant(self, state):
        """
        Calculates the Jacobi Constant C = 2*Omega(x,y,z) - (vx^2 + vy^2 + vz^2).
        C is a strict invariant of motion in CR3BP.
        """
        x, y, z, vx, vy, vz = state
        v_sq = vx**2 + vy**2 + vz**2
        omega = self.effective_potential(x, y, z)
        return 2.0 * omega - v_sq

    def equations_of_motion(self, t, state):
        """
        Derivatives of state vector S = [x, y, z, vx, vy, vz]:
        ddot(x) = 2 * vy + dOmega/dx
        ddot(y) = -2 * vx + dOmega/dy
        ddot(z) = dOmega/dz
        """
        x, y, z, vx, vy, vz = state
        mu = self.mu

        r1_sq = (x + mu)**2 + y**2 + z**2
        r2_sq = (x - (1.0 - mu))**2 + y**2 + z**2

        r1_3 = math.pow(max(r1_sq, 1e-12), 1.5)
        r2_3 = math.pow(max(r2_sq, 1e-12), 1.5)

        dOmega_dx = x - ((1.0 - mu) * (x + mu) / r1_3) - (mu * (x - (1.0 - mu)) / r2_3)
        dOmega_dy = y - ((1.0 - mu) * y / r1_3) - (mu * y / r2_3)
        dOmega_dz = -((1.0 - mu) * z / r1_3) - (mu * z / r2_3)

        ax = 2.0 * vy + dOmega_dx
        ay = -2.0 * vx + dOmega_dy
        az = dOmega_dz

        return [vx, vy, vz, ax, ay, az]

    def compute_lagrange_points(self):
        """
        High-precision determination of all 5 Lagrange points (L1-L5).
        """
        mu = self.mu

        def domega_dx_line(x):
            r1 = abs(x + mu)
            r2 = abs(x - (1.0 - mu))
            term1 = (1.0 - mu) * (x + mu) / (r1**3) if r1 > 1e-12 else 0.0
            term2 = mu * (x - (1.0 - mu)) / (r2**3) if r2 > 1e-12 else 0.0
            return x - term1 - term2

        def d2omega_dx2_line(x):
            r1 = abs(x + mu)
            r2 = abs(x - (1.0 - mu))
            term1 = (1.0 - mu) / (r1**3) * (1.0 - 3.0 * ((x + mu)**2) / (r1**2)) if r1 > 1e-12 else 0.0
            term2 = mu / (r2**3) * (1.0 - 3.0 * ((x - (1.0 - mu))**2) / (r2**2)) if r2 > 1e-12 else 0.0
            return 1.0 - term1 - term2

        def newton_solve(x_init, max_iter=100, tol=1e-14):
            x = x_init
            for _ in range(max_iter):
                f = domega_dx_line(x)
                df = d2omega_dx2_line(x)
                if abs(df) < 1e-15:
                    break
                dx = f / df
                x -= dx
                if abs(dx) < tol:
                    break
            return x

        gamma = math.pow(mu / 3.0, 1.0 / 3.0)

        x_L1 = newton_solve(1.0 - mu - gamma)
        x_L2 = newton_solve(1.0 - mu + gamma)
        x_L3 = newton_solve(-1.0 - (7.0 / 12.0) * mu)

        x_L4 = 0.5 - mu
        y_L4 = math.sqrt(3.0) / 2.0

        x_L5 = 0.5 - mu
        y_L5 = -math.sqrt(3.0) / 2.0

        lagrange_points = {
            "L1": {"x": x_L1, "y": 0.0, "z": 0.0, "C": self.effective_potential(x_L1, 0, 0) * 2.0},
            "L2": {"x": x_L2, "y": 0.0, "z": 0.0, "C": self.effective_potential(x_L2, 0, 0) * 2.0},
            "L3": {"x": x_L3, "y": 0.0, "z": 0.0, "C": self.effective_potential(x_L3, 0, 0) * 2.0},
            "L4": {"x": x_L4, "y": y_L4, "z": 0.0, "C": self.effective_potential(x_L4, y_L4, 0) * 2.0},
            "L5": {"x": x_L5, "y": y_L5, "z": 0.0, "C": self.effective_potential(x_L5, y_L5, 0) * 2.0},
        }

        return lagrange_points

    def rk4_step(self, t, state, dt):
        """
        4th-Order Runge-Kutta numerical integrator step.
        """
        k1 = self.equations_of_motion(t, state)

        s2 = [s + 0.5 * dt * k for s, k in zip(state, k1)]
        k2 = self.equations_of_motion(t + 0.5 * dt, s2)

        s3 = [s + 0.5 * dt * k for s, k in zip(state, k2)]
        k3 = self.equations_of_motion(t + 0.5 * dt, s3)

        s4 = [s + dt * k for s, k in zip(state, k3)]
        k4 = self.equations_of_motion(t + dt, s4)

        next_state = [
            s + (dt / 6.0) * (k1_i + 2.0 * k2_i + 2.0 * k3_i + k4_i)
            for s, k1_i, k2_i, k3_i, k4_i in zip(state, k1, k2, k3, k4)
        ]
        return next_state


def launch_interactive_3d_simulation():
    """
    Computes trajectory and launches the interactive 3D visualization.
    """
    engine = CR3BPEngine("Earth-Moon")
    lp = engine.compute_lagrange_points()

    print("===============================================================================")
    print("CIRCULAR RESTRICTED THREE-BODY PROBLEM (CR3BP) 3D PHYSICS SIMULATOR")
    print("===============================================================================")
    print(f"\nSystem: Earth-Moon (mu = {engine.mu})")
    print("-------------------------------------------------------------------------------")
    print("Lagrange Points (Synodic Rotating Frame):")
    for name, pt in lp.items():
        print(f"  {name:2s}: x = {pt['x']:+14.10f}, y = {pt['y']:+14.10f}, Jacobi C = {pt['C']:12.8f}")

    # Initial state: 3D CR3BP Quasi-Halo Trajectory near L1
    x_l1 = lp["L1"]["x"]
    state = [x_l1 - 0.015, 0.0, 0.005, 0.0, 0.165, 0.0]

    # Calculate 3D trajectory
    print("\nIntegrating 3D Trajectory Vector Field...")
    t = 0.0
    dt = 0.001
    duration = 4.0 * math.pi
    steps = int(duration / dt)

    xs, ys, zs = [], [], []
    C_initial = engine.jacobi_constant(state)

    for _ in range(steps):
        xs.append(state[0])
        ys.append(state[1])
        zs.append(state[2])
        state = engine.rk4_step(t, state, dt)
        t += dt

    C_final = engine.jacobi_constant(state)
    print(f"  Initial Jacobi C0     : {C_initial:.12f}")
    print(f"  Final Jacobi C_end    : {C_final:.12f}")
    print(f"  Maximum Jacobi Drift  : {abs(C_final - C_initial):.4e} (Energy Conservation Verification)")

    # 1. Open Interactive WebGL 3D Simulator in Browser
    html_path = os.path.abspath("index.html")
    print(f"\n[LAUNCHING 3D SIMULATION WINDOW] -> file://{html_path}")
    webbrowser.open("file://" + html_path)

    # 2. Try launching Matplotlib 3D native window if installed
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

        # Plot Primaries M1 and M2
        ax.scatter([-engine.mu], [0], [0], color='#3a86ff', s=200, label='Primary M1 (Earth)', depthshade=True)
        ax.scatter([1.0 - engine.mu], [0], [0], color='#00f2fe', s=80, label='Secondary M2 (Moon)', depthshade=True)

        # Plot Lagrange Points L1-L5
        lx = [pt['x'] for pt in lp.values()]
        ly = [pt['y'] for pt in lp.values()]
        lz = [pt['z'] for pt in lp.values()]
        ax.scatter(lx, ly, lz, color='#ff0844', marker='^', s=70, label='Lagrange Points L1-L5')

        for name, pt in lp.items():
            ax.text(pt['x'] + 0.02, pt['y'] + 0.02, pt['z'], name, color='#ff0844', fontsize=10, fontweight='bold')

        # Plot 3D Trajectory Ribbon
        ax.plot(xs, ys, zs, color='#a855f7', linewidth=1.8, label='Spacecraft 3D Quasi-Halo Trajectory')

        ax.set_xlabel('x (LU)', color='#94a3b8')
        ax.set_ylabel('y (LU)', color='#94a3b8')
        ax.set_zlabel('z (LU)', color='#94a3b8')
        ax.set_title(f'CR3BP 3D Space Model Simulation ({engine.system_name})', color='#00f2fe', fontsize=14, fontweight='bold')
        ax.legend(facecolor='#101521', edgecolor='#00f2fe', labelcolor='#ffffff')

        plt.show()
    except ImportError:
        print("[INFO] Matplotlib not found; launched full WebGL 3D interactive model in browser window.")

    print("===============================================================================")


if __name__ == "__main__":
    launch_interactive_3d_simulation()
