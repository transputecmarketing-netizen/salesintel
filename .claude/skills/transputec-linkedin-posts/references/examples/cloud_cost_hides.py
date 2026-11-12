"""Example carousel: Week 2 of the November 2026 series (8 slides). Real content from brand-samples/linkedin-nov."""
from layouts import *

SERIES = "FinOps · Week 2"
SLIDES = [
    cover("Cost control series", 'Five places your<br><span class="b">cloud cost hides</span>',
          "You cannot cut what you cannot see. The usual suspects behind a climbing AWS bill.", "magnifier"),
    statement("Start here", 'A climbing bill is rarely<br>one big mistake.',
              "It is usually many small ones, running quietly where nobody is looking."),
    point(1, "server", "Idle and oversized compute", "What it looks like", "Instances sized for a peak that never comes, or left running overnight and at weekends.", "Where to look", "AWS Compute Optimizer and utilisation in CloudWatch."),
    point(2, "storage", "Storage nobody deletes", "What it looks like", "Unattached volumes, old snapshots and buckets with no lifecycle rules.", "Where to look", "EBS volumes in the available state, and S3 Storage Lens."),
    point(3, "transfer", "Data on the move", "What it looks like", "Traffic between zones and regions, and NAT gateways processing more than anyone expected.", "Where to look", "Cost Explorer, grouped by usage type."),
    point(4, "flask", "Forgotten environments", "What it looks like", "Test and proof-of-concept stacks that outlived the project they were built for.", "Where to look", "Untagged resources, and stacks with no named owner."),
    point(5, "contract", "Commitments that do not fit", "What it looks like", "On-demand rates for steady workloads, or Savings Plans bought for usage that has since moved.", "Where to look", "Savings Plans coverage and utilisation reports."),
    cta('Find yours before<br>the next invoice.', "Most estates have at least one of these. The fix starts with seeing it.",
        secondary="Follow for the series", next_txt="What FinOps actually is."),
]
CAPTION = """You cannot cut what you cannot see.

A climbing AWS bill is rarely one big mistake. It is usually five quiet ones: idle compute, storage nobody deletes, data on the move, forgotten environments and commitments that no longer fit.

Swipe through to see what each looks like, and exactly where to look in your own account.

Which one would you find first?

#FinOps #AWS #CloudCostOptimisation #CloudCosts"""
NOTES = "Upload the PDF as a document post so it swipes. Any figures belong in the caption, with a source."
