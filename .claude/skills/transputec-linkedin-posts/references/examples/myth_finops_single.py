"""Example single-image post: Week 3 myth vs reality card (1 slide, PNG only, no PDF, no A4)."""
from layouts import *

SERIES = "AWS · FinOps · Week 3"
SLIDES = [
    myth("FinOps", 'Myth <span style="color:#AEBACC;font-weight:300">vs</span> <span class="b">reality</span>', [
        ("FinOps is a tool you buy.", "It is a discipline your teams practise."),
        ("FinOps means cutting cost.", "It means spending with intent."),
        ("Finance owns it.", "Engineering, finance and the business share it."),
        ("It is a one-off project.", "It is a cycle of continuous review."),
    ]),
]
A4 = False
CAPTION = """FinOps is not a tool you buy. It is a discipline your teams practise.

Four myths we hear most, and what is actually true.
The short version: spend with intent, share the ownership, review it every month.

Which one did your organisation believe?

#FinOps #AWS #CloudFinance #CloudGovernance"""
