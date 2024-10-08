import click
from loguru import logger
from pydantic import BaseModel, Field

click_name = "hello"
click_setup = [
    click.argument("name", required=False, default="Anonymous", envvar="HELLO_NAME"),
    click.option("--fail", is_flag=True),
]


class HelloParameters(BaseModel):
    name: str = Field(min_length=3)


def click_command(name: str, fail: bool):
    """Greet NAME."""
    logger.info("Starting 'hello' command...")
    if fail:
        raise Exception("Raising an exception as requested!")
    _print_name(HelloParameters(name=name))
    logger.info("Finished 'hello' command...")


def _print_name(parameters: HelloParameters):
    msg = f"Hello {parameters.name}!"
    logger.debug("In _print_name function for {}", parameters.name)
    click.secho(msg, fg="green")
