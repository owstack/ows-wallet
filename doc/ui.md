UI Guidelines
=======

## Cards

TBD

## Lists

Class `list` defines a list.  Each `item` is a member of the list and defines it's own content.

    <div class="list">
      <div class="item">
        <span>Hello</span>
      </div>
      <div class="item">
        <span>World!</span>
      </div>
    </div> 

### Classes

An `item` may be further qualified by adding any of the following classes to the `item` element.

- `item-divider` - the space between `list` sections, may include optional content (e.g., section header text)
- `item-icon-left` - providing space to the left of the item for an icon (e.g., a visual reference to the entry)
- `item-icon-right` - providing space to the right of the item for an icon (e.g., a right chevron indicating navigation)
- `item-stacked-label` - organizes the labels and input elements vetically
- `item-fh` - by default a `list` `item` has a fixed height to provide list uniformity, adding `item-fh` allows the `item` to use its full height
- `has-detail` - provides vertical centering when the item text has two rows (e.g., an `item-detail`)
- `has-label` - provides vertical space for a label (e.g., `input-label`)
- `has-click` - styles the cursor to indicate a clickable `item`

Qualify a child of the `item` element with the following to provide additional content.

- `item-detail` - styles a second line (below the item main text); e.g., as the value of a setting
- `input-label` - styles an informative label for the `item`

Example:

    <div class="list">
      <div class="item item-divider"></div>
      <a class="item item-icon-left item-icon-right" ui-sref="tabs.addressbook">
        <i class="icon list-icon">
          <img src="img/icon-contacts.svg" class="bg"/>
        </i>
        <div translate>Address Book</div>
        <i class="icon arrow-right"></i>
      </a>
      <a class="item item-icon-left item-icon-right" ui-sref="help">
        <i class="icon list-icon">
          <img src="img/icon-help-support.svg" class="bg"/>
        </i>
        <div translate>Get Help</div>
        <i class="icon arrow-right"></i>
      </a>
			<label class="item item-input item-stacked-label">
        <span class="input-label" translate>Name</span>
        <input type="text" id="name" placeholder="Name" name="name" ng-model="addressbookEntry.name" required>
      </label>
      <div class="item item-divider"></div>
      <div class="item item-icon-right has-click" ng-click="sendTo()">
        <span translate>Send Money</span>
        <i class="icon arrow-right"></i>
      </div>
      <a class="item has-detail item-icon-left item-icon-right" ui-sref="tabs.language">
        <i class="icon list-icon">
          <img src="img/icon-language.svg" class="bg"/>
        </i>
        <div translate>Language</div>
        <div class="item-detail">{{currentLanguageName | translate}}</div>
        <i class="icon arrow-right"></i>
      </a>
    </div>



