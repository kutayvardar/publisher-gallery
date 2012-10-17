Publisher Widget Video Gallery
=============

Script used to generate a video gallery / a companion video block.

Gallery
------------
    
    <script>
        // we define here all the categories we would like to display in our video gallery
        var categoryList = [
            { list: '/mychannel/videogames-en', title: 'All the videos' }, // Customize your menu titles by passing objects with two parameters: list and title.
            '/user/Activision', // This menu title won't be customized (will retrieve the default value on Dailymotion)
            '/user/ElectronicArts', 
            '/user/ign'
        ];

        window.dmPublisherAsyncInitGallery = function()
        {
            // init the gallery
            DM_PublisherGallery.init({
                containerId: 'YOUR_CONTAINER_ID', // (required) the id of your container
                categories: categoryList,   // (required) an array containing lists
                syndication: 106392, // (optional) your syndication key if you are a publisher (more info on http://publisher.dailymotion.com)
                loadMore: 'Load more videos!', // (optional, default = 'Show more videos') the text to display in the load more button
                limit: 24 // (optional, default = 12, max = 100) how many videos you want to load when the script is launched and when a user press the load more button
            });
        };
        (function() {
            var e = document.createElement('script'); e.async = true;
            e.src = 'http://publisher.dailymotion.com/widgets/gallery/gallery.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(e, s);
        }());
    </script>

Video block
------------

    <script>    
        window.dmPublisherAsyncInitGallery = function()
        {
            // init the video block
            DM_PublisherGallery.init({
                containerId: 'YOUR_CONTAINER_ID', // (required) the id of your container
                list: '/user/ign', // (required) we specify the list to load in our video block (this list should be in your video gallery)
                href: 'http://my-website.com/link-to-my-video-gallery.html', // (required) your video gallery URL
                width: 400, // (required) the width of the video block
                columns: 2, // (optional, default = 1) the number of columns you want to have 
                limit: 6 // (optional, default = 12, max = 100) number of videos to display in the block
            });
        };
        (function() {
            var e = document.createElement('script'); e.async = true;
            e.src = 'http://publisher.dailymotion.com/widgets/gallery/gallery.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(e, s);
        }());
    </script>