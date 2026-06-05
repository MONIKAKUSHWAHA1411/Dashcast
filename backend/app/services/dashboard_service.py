"""
dashboard_service.py
~~~~~~~~~~~~~~~~~~~~
Builds the dashboard ``config`` JSON from extracted QA metrics.
All chart options use Apache ECharts v5 syntax.
"""

import secrets
from typing import Any, Dict, List, Optional


def _widget_id() -> str:
    """Return a short random widget identifier."""
    return "w" + secrets.token_hex(4)


def _fmt_pass_rate(value: Optional[Any]) -> str:
    """Format a pass-rate float as a percentage string, or return 'N/A'."""
    if value is None:
        return "N/A"
    try:
        return f"{float(value):.1f}%"
    except (TypeError, ValueError):
        return "N/A"


def _or_na(value: Optional[Any]) -> Any:
    """Return the value if truthy (including 0), else 'N/A'."""
    if value is None:
        return "N/A"
    return value


def generate_dashboard_config(raw_metrics: Dict[str, Any], title: str) -> Dict[str, Any]:
    """Build the full dashboard config JSON from *raw_metrics*.

    Args:
        raw_metrics: Dict returned by :func:`llm_service.extract_metrics`.
        title: Dashboard title (usually the test suite name or filename).

    Returns:
        A config dict matching the DashboardConfig schema, ready to be stored
        in the ``dashboards.config`` column.
    """
    widgets: List[Dict[str, Any]] = []
    position = 0

    # ------------------------------------------------------------------
    # 4 KPI widgets – always present
    # ------------------------------------------------------------------
    kpi_definitions = [
        ("Total Tests", raw_metrics.get("total_tests"), "blue"),
        ("Passed", raw_metrics.get("passed"), "green"),
        ("Failed", raw_metrics.get("failed"), "red"),
        ("Pass Rate", None, "teal"),  # handled separately below
    ]

    for label, value, color in kpi_definitions:
        if label == "Pass Rate":
            display_value = _fmt_pass_rate(raw_metrics.get("pass_rate"))
        else:
            display_value = _or_na(value)

        widgets.append(
            {
                "id": _widget_id(),
                "type": "kpi",
                "position": position,
                "config": {
                    "label": label,
                    "value": display_value,
                    "color": color,
                },
            }
        )
        position += 1

    # ------------------------------------------------------------------
    # Pie chart – pass / fail distribution
    # ------------------------------------------------------------------
    passed = raw_metrics.get("passed")
    failed = raw_metrics.get("failed")
    if passed is not None and failed is not None:
        pie_option = {
            "tooltip": {"trigger": "item"},
            "legend": {"orient": "vertical", "left": "left"},
            "series": [
                {
                    "name": "Test Results",
                    "type": "pie",
                    "radius": "60%",
                    "data": [
                        {"value": passed, "name": "Passed", "itemStyle": {"color": "#22c55e"}},
                        {"value": failed, "name": "Failed", "itemStyle": {"color": "#ef4444"}},
                    ],
                    "emphasis": {
                        "itemStyle": {
                            "shadowBlur": 10,
                            "shadowOffsetX": 0,
                            "shadowColor": "rgba(0,0,0,0.5)",
                        }
                    },
                }
            ],
        }
        widgets.append(
            {
                "id": _widget_id(),
                "type": "chart",
                "position": position,
                "config": {
                    "title": "Pass/Fail Distribution",
                    "chartType": "pie",
                    "echartsOption": pie_option,
                },
            }
        )
        position += 1

    # ------------------------------------------------------------------
    # Line chart – daily trend (stacked bar, as per spec example)
    # ------------------------------------------------------------------
    daily_trend: List[Dict[str, Any]] = raw_metrics.get("daily_trend") or []
    if len(daily_trend) >= 2:
        dates = [entry.get("date", "") for entry in daily_trend]
        passed_series = [entry.get("passed", 0) for entry in daily_trend]
        failed_series = [entry.get("failed", 0) for entry in daily_trend]

        trend_option = {
            "tooltip": {"trigger": "axis"},
            "legend": {},
            "xAxis": {"type": "category", "data": dates},
            "yAxis": {"type": "value"},
            "series": [
                {
                    "name": "Passed",
                    "type": "bar",
                    "data": passed_series,
                    "itemStyle": {"color": "#22c55e"},
                },
                {
                    "name": "Failed",
                    "type": "bar",
                    "data": failed_series,
                    "itemStyle": {"color": "#ef4444"},
                },
            ],
        }
        widgets.append(
            {
                "id": _widget_id(),
                "type": "chart",
                "position": position,
                "config": {
                    "title": "Daily Trend",
                    "chartType": "line",
                    "echartsOption": trend_option,
                },
            }
        )
        position += 1

    # ------------------------------------------------------------------
    # Bar chart – severity distribution
    # ------------------------------------------------------------------
    severity_counts: Dict[str, int] = raw_metrics.get("severity_counts") or {}
    if any(v for v in severity_counts.values()):
        severity_labels = list(severity_counts.keys())
        severity_values = list(severity_counts.values())

        severity_option = {
            "tooltip": {"trigger": "axis"},
            "xAxis": {"type": "category", "data": severity_labels},
            "yAxis": {"type": "value"},
            "series": [
                {
                    "name": "Defects",
                    "type": "bar",
                    "data": severity_values,
                    "itemStyle": {"color": "#f97316"},
                }
            ],
        }
        widgets.append(
            {
                "id": _widget_id(),
                "type": "chart",
                "position": position,
                "config": {
                    "title": "Severity Distribution",
                    "chartType": "bar",
                    "echartsOption": severity_option,
                },
            }
        )
        position += 1

    # ------------------------------------------------------------------
    # Horizontal bar chart – module failures
    # ------------------------------------------------------------------
    module_failures: List[Dict[str, Any]] = raw_metrics.get("module_failures") or []
    if module_failures:
        modules = [m.get("module", "Unknown") for m in module_failures]
        failures = [m.get("failures", 0) for m in module_failures]

        module_option = {
            "tooltip": {"trigger": "axis", "axisPointer": {"type": "shadow"}},
            "xAxis": {"type": "value"},
            "yAxis": {"type": "category", "data": modules},
            "series": [
                {
                    "name": "Failures",
                    "type": "bar",
                    "data": failures,
                    "itemStyle": {"color": "#dc2626"},
                }
            ],
        }
        widgets.append(
            {
                "id": _widget_id(),
                "type": "chart",
                "position": position,
                "config": {
                    "title": "Module Failures",
                    "chartType": "bar",
                    "echartsOption": module_option,
                },
            }
        )
        position += 1

    return {
        "version": 1,
        "title": title,
        "widgets": widgets,
    }
