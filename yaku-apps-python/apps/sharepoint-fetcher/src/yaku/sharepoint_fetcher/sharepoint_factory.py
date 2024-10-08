from yaku.sharepoint_fetcher.config import Settings

from .cloud.sharepoint_fetcher_cloud import SharepointFetcherCloud
from .on_premise.sharepoint_fetcher_on_premise import SharepointFetcherOnPremise


class SharePointFetcherFactory:
    @classmethod
    def selectSharepointInstance(
        cls,
        settings: Settings,
        list_title_property_map,
        config_file_data,
    ):
        if settings.is_cloud == False:
            return SharepointFetcherOnPremise(
                settings.sharepoint_path,
                settings.destination_path,
                settings.sharepoint_site,
                settings.username,
                settings.password,
                force_ip=settings.force_ip,
                list_title_property_map=list_title_property_map,
                download_properties_only=settings.download_properties_only,
                filter_config=config_file_data,
            )
        elif settings.is_cloud == True:  # Still keeping this clause for clarity
            return SharepointFetcherCloud(
                settings.sharepoint_path,
                settings.destination_path,
                settings.sharepoint_site,
                settings.tenant_id,
                settings.client_id,
                settings.client_secret,
                force_ip=settings.force_ip,
                download_properties_only=settings.download_properties_only,
                filter_config=config_file_data,
            )
