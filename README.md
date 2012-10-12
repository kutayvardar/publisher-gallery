Publisher Widget Video Gallery
=============

Script used to generate a video gallery / a companion video block.

Gallery
------------
    
    <script>
        // we define here all the categories we would like to display in our video gallery
        var categoryList = [
            { list: '/mychannel/videogames-en', title: 'All the videos' }, // we want this section to have a specific name
            '/user/Activision', // we will let the script retrieve the name of this list on Dailymotion
            '/user/ElectronicArts', 
            '/user/ign'
        ];

        window.dmPublisherAsyncInitGallery = function()
        {
            // init the gallery
            DM_PublisherGallery.init({
                containerId: 'YOUR_CONTAINER_ID', // the id of your container
                categories: categoryList,   // an array containing lists
                syndication: 106392, // your syndication key if you are a publisher (more info on http://publisher.dailymotion.com)
                loadMore: 'Load more videos!', // the text to display in the load more button
                limit: 24 // how many videos you want to load when the script is launched and when a user press the load more button (default: 12, max: 100)
            });
        };
        (function() {
            var e = document.createElement('script'); e.async = true;
            e.src = 'http://publisher.dailymotion.com/widgets/gallery.js';
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
                containerId: 'YOUR_CONTAINER_ID', // the id of your container
                list: '/user/ign', // we specify the list to load in our video block (this list should be in your video gallery)
                href: 'http://my-website.com/link-to-my-video-gallery.html', // your video gallery URL
                width: 400, // the width of the video block (default; 100%)
                columns: 2, // the number of columns you want to have (default: 1)
                limit: 6 // number of videos to display in the block (default: 12, max: 100)
            });
        };
        (function() {
            var e = document.createElement('script'); e.async = true;
            e.src = 'http://publisher.dailymotion.com/widgets/gallery.js';
            var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(e, s);
        }());
    </script>