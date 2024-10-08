import json
import random
from typing import List, Optional

import pytest
from yaku.autopilot_utils.results import Output, Result, ResultsCollector


def test_output_dataclass():
    o = Output("key", "value")
    assert o.key == "key"
    assert o.value == "value"
    assert json.loads(o.to_json()) == {"output": {"key": "value"}}


@pytest.fixture
def result_maker():
    def maker(possible_values: Optional[List[bool]] = None):
        if possible_values is None:
            possible_values = [True, False]
        return Result(
            f"criterion: {random.randint(1, 100)}",
            random.choice(possible_values),
            "some justification",
        )

    return maker


def test_result_collector_can_count(result_maker):
    results = ResultsCollector()
    results.append(result_maker())
    results.append(result_maker())
    assert len(results) == 2
    results.append(result_maker())
    assert len(results) == 3


def test_result_collector_accepts_only_results(result_maker):
    results = ResultsCollector()
    results.append(result_maker())
    with pytest.raises(TypeError):
        results.append(1)  # type: ignore


def test_result_collector_can_extend_with_list_of_results(result_maker):
    results = ResultsCollector()
    results.extend([result_maker(), result_maker()])
    assert len(results) == 2


def test_result_collector_can_access_results_by_index(result_maker):
    results = ResultsCollector()
    results.extend(
        [result_maker(possible_values=[True]), result_maker(possible_values=[False])]
    )
    assert len(results) == 2
    assert results[0].fulfilled == True
    assert results[1].fulfilled == False


def test_result_has_all_necessary_fields():
    r = Result(criterion="foo", fulfilled=False, justification="bar")
    assert r.criterion == "foo"
    assert r.fulfilled == False
    assert r.justification == "bar"
    assert r.metadata == {}


@pytest.mark.parametrize(
    ("boolish", "bool_value"),
    [
        (True, True),
        ("True", True),
        ("true", True),
        ("1", True),
        (1, True),
        (False, False),
        ("False", False),
        ("false", False),
        ("0", False),
        (0, False),
    ],
)
def test_result_converts_fulfilled_to_bool(boolish, bool_value):
    r = Result("c", boolish, "j")
    assert r.fulfilled == bool_value


def test_collector_is_globally_available():
    from yaku.autopilot_utils.results import RESULTS

    assert len(RESULTS) == 0


def test_collector_supports_bool(result_maker):
    results = ResultsCollector()
    assert results
    results.append(result_maker([True]))
    assert results
    results.append(result_maker([False]))
    assert not results


def test_collector_can_iter_results(result_maker):
    results = ResultsCollector()
    result1 = result_maker([True])
    result2 = result_maker([False])
    results.append(result1)
    results.append(result2)

    collected_results = []
    for r in results:
        collected_results.append(r)

    assert collected_results == [result1, result2]


def test_collector_can_export_to_json():
    collector = ResultsCollector()
    r1 = Result(criterion="foo", fulfilled=False, justification="bar")
    r2 = Result(criterion="other foo", fulfilled=True, justification="some bar")
    results = [r1, r2]
    collector.append(r1)
    collector.append(r2)

    json_string = collector.to_json()

    for nr, line in enumerate(json_string.split("\n")):
        data = json.loads(line)
        assert Result(**data["result"]) == results[nr]
